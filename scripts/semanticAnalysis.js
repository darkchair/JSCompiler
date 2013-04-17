/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var semanticAnalysisScope = 0;

function SemanticError(message) {
    this.name = "SemanticError";
    this.message = message || "Default Message";
}

SemanticError.prototype = new Error();
SemanticError.prototype.constructor = SemanticError;

function analyze() {
    errorCount = 0; warningCount = 0;
    putMessage("\n-------------------");
    putMessage("Analyzing semantics ...");
    
    //Start with first 'real' node, usually a StatementBlock
    //Make recursive calls to recordAndCheckNode through the AST
    recordAndCheckNode(abstractSyntaxTree.root.children[0]);

    if( areUnassignedVariables() !== 0 ) {
        putMessage("WARNING: Unassigned variable at position ");
    }
    
    printSymbolTable();
    putMessage("\nSemantic Analysis found " + errorCount + " error(s).\n" +
               "Semantic Analysis found " + warningCount + " warning(s).");
}

function recordAndCheckNode(node) {
    
    if(node.value === "StatementBlock") {
        semanticAnalysisScope++;
        symbolTableTree.addChild();
        for(var i=0; i<node.children.length; i++) {
            recordAndCheckNode(node.children[i]);
        }
        symbolTableTree.backToParent();
        semanticAnalysisScope--;
    }
    
    else if(node.value === "Declaration") {
        var type = node.children[0].value;
        var id = node.children[1].value;
        if (isDuplicateDeclaration(id) !== 0) {
            putMessage("ERROR: Redeclaration at position " + node.children[0].position);
            throw new SemanticError("Error: Redeclaration at position " + node.children[0].position);
        }
        symbolTableTree.activeNode.pushSymbol(type, id, 0);
        putMessage("In scope " + symbolTableTree.activeNode.scopeId + ", \'" +
                id + "\' declared as a(n) " + type);
        return;
    }
    
    else if(node.value === "Assign") {
        var type = evaluateExpression(node);
        var checkType = idType(node.children[0].value);
        if(checkType === type) {
            return;
        }
        else if(checkType !== "null"){
            putMessage("ERROR: Type mismatch at position " + node.children[0].position);
            throw new SemanticError("Error: Type mismatch at position " + node.children[0].position);
        }
        else {
            putMessage("ERROR: Undeclared variable at position " + node.children[0].position);
            throw new SemanticError("Error: Undeclared variable at position " + node.children[0].position);
        }
    }
    
    else if(node.value === "PrintExpression") {
        var checkType = idType(node.children[0].value);
        if(checkType !== "null") {
            return;
        }
        else {
            putMessage("ERROR: Undeclared variable at position " + node.children[0].position);
            throw new SemanticError("Error: Undeclared variable at position " + node.children[0].position);
        }
    }
    
}

function evaluateExpression(node) {
    //This isn't robust enough
    if(evaluateInt(node))
        return "int";
    if(evaluateString(node))
        return "string";
    else
        return "invalid";
    
}

function evaluateInt(node) {
    
    for(var i=0; i<node.children[1].value.length; i++) {
        
        if(
           node.children[1].value.charAt(i) === "+" ||
           node.children[1].value.charAt(i) === "-" ||
           (node.children[1].value.charCodeAt(i) >= 48 &&
             node.children[1].value.charCodeAt(i) <= 57)
          ) {
            continue;
        }
        else if(node.children[1].value.charCodeAt(i) >= 97 &&
                node.children[1].value.charCodeAt(i) <= 122) {
            if(idType(node.children[1].value.charAt(i)) !== "int")
                return false;
        }
        else {
            return false;
        }
        
    }
    
    return true;
    
}

function evaluateString(node) {
    
    //Does this need a better evaluation?
    if(node.children[1].value.charAt(0) === "\"") {
        return true;
    }
    
}

function idType(id) {
    
    //Stores location where semantic analysis was before searching for declaration
    var nodeLocation = symbolTableTree.activeNode;
    
    do {
        
        for(var i=0; i<symbolTableTree.activeNode.table.length; i++) {
        //For every entry in the scope's table,
        //If the id was declared here then return the type it was declared as
            if(symbolTableTree.activeNode.table[i].id === id) {
                symbolTableTree.activeNode.table[i].assigned = true;
                putMessage("Variable \'" + id + "\' IS of type " +
                        symbolTableTree.activeNode.table[i].type +
                        " in scope " + symbolTableTree.activeNode.scopeId);
                var returnType = symbolTableTree.activeNode.table[i].type;
                symbolTableTree.activeNode = nodeLocation;
                return returnType;
            }

        }
        //Move up the tree to the current scope's parent
        symbolTableTree.activeNode = symbolTableTree.activeNode.parent;
        
    } while(symbolTableTree.activeNode !== null);
    
    symbolTableTree.activeNode = nodeLocation;
    return "null";
    
}

function areUnassignedVariables() {
    //NEEDS TO SEARCH PARALLEL SCOPES
    //Stores location where semantic analysis was before searching for declaration
    var nodeLocation = symbolTableTree.activeNode;
    
    do {
        
        //for(var j=0; j<symbolTableTree.activeNode.children.length; j++)
        for(var i=0; i<symbolTableTree.activeNode.table.length; i++) {
        //For every entry in the scope's table,
        //If the id was declared before then return the position of the declaration
            if(symbolTableTree.activeNode.table[i].assigned === false) {
                symbolTableTree.activeNode = nodeLocation;
                return 1;//Should be position of duplicate declaration
            }

        }
        //Move up the tree to the current scope's parent
        symbolTableTree.activeNode = symbolTableTree.activeNode.parent;
        
    } while(symbolTableTree.activeNode !== null);
    
    symbolTableTree.activeNode = nodeLocation;
    return 0;
    
}

function isDuplicateDeclaration(id) {
    
    //Stores location where semantic analysis was before searching for declaration
    var nodeLocation = symbolTableTree.activeNode;
    do {
        
        for(var i=0; i<symbolTableTree.activeNode.table.length; i++) {
        //For every entry in the scope's table,
        //If the id was declared before then return the position of the declaration
            if(symbolTableTree.activeNode.table[i].id === id) {
                symbolTableTree.activeNode = nodeLocation;
                return 1;//Should be position of duplicate declaration
            }

        }
        //Move up the tree to the current scope's parent
        symbolTableTree.activeNode = symbolTableTree.activeNode.parent;
        
    } while(symbolTableTree.activeNode !== null);
    
    symbolTableTree.activeNode = nodeLocation;
    return 0;
    
}


function printSymbolTable() {
    
    document.getElementById("symbolTable").value += symbolTableTree.toString();
    
    /*for(var i = symbolTables.length - 1; i >= 0; i--) {
        document.getElementById("symbolTable").value += "-- Scope " + i + " --\n";
        for(var j=0; j<symbolTables[i].table.length; j++) {
            document.getElementById("symbolTable").value += 
                    symbolTables[i].table[j].type + " " + symbolTables[i].table[j].id + "\n";
        }
    }*/
}