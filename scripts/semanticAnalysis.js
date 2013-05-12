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

    //Recursive call that returns position of first unassigned variable it finds,
    //-1 if none found
    var unassignedTest = areUnassignedVariables(symbolTableTree.root);
    if( unassignedTest !== -1 ) {
        warningCount++;
        putMessage("WARNING: Unassigned variable at position " + unassignedTest);
    }
    var unusedTest = areUnusedVariables(symbolTableTree.root);
    if( unusedTest !== -1 ) {
        warningCount++;
        putMessage("WARNING: Unused variable at position " + unusedTest);
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
        if (isDuplicateDeclaration(id)) {
            putMessage("ERROR: Redeclaration at position " + node.children[0].position);
            throw new SemanticError("Error: Redeclaration at position " + node.children[0].position);
        }
        symbolTableTree.activeNode.pushSymbol(type, id, node.children[0].position);
        node.scope = symbolTableTree.activeNode;
        putMessage("In scope " + symbolTableTree.activeNode.scopeId + ", \'" +
                id + "\' declared as a(n) " + type);
    }
    
    else if(node.value === "Assign") {
        var checkType = idType(node.children[0].value); //type of identifier
        var type = evaluateExpression(node.children[1]); //type of expression being assigned
        if(checkType === type) {
            node.scope = idScope(node.children[0].value);
        }
        else if(checkType !== "null"){
            putMessage("ERROR: Type mismatch at position " + node.children[0].position);
            throw new SemanticError("Error: Type mismatch at position " + node.children[0].position);
        }
        else {
            putMessage("ERROR: Undeclared variable at position " + node.children[0].position);
            throw new SemanticError("Error: Undeclared variable at position " + node.children[0].position);
        }
        //Check if variables in expression are declared!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        /*if(expressionHasUndeclareds(node)) {
            putMessage("ERROR: Undeclared variable at position " + node.children[0].position);
            throw new SemanticError("Error: Undeclared variable at position " + node.children[0].position);
        }*/
    }
    
    else if(node.value === "PrintExpression") {
        
        if( node.children[0].value.length === 1 &&
            (node.children[0].value.charCodeAt(0) >= 97 &&
                node.children[0].value.charCodeAt(0) <= 122) ) {
            
            var checkType = idType(node.children[0].value);
            if(checkType !== "null") {
                node.scope = idScope(node.children[0].value);
                markVariableAsUsed(node.children[0].value);
            }
            else {
                putMessage("ERROR: Undeclared variable at position " +
                        node.children[0].position);
                throw new SemanticError("Error: Undeclared variable at position " +
                        node.children[0].position);
            }
        }
        
    }
    
}

function evaluateExpression(node) {
    //This isn't robust enough, I think
    if(evaluateInt(node))
        return "int";
    else if(evaluateString(node))
        return "string";
    else
        return "invalid";
    
}

function evaluateInt(node) {
    
    if(node.value === "+" || node.value === "-" ||
        (node.value.charCodeAt(0) >= 48  && node.value.charCodeAt(0) <= 57) ) {
       return true;
    }
    else if (node.value.charCodeAt(0) >= 97 &&
                node.value.charCodeAt(0) <= 122) {
            if(idType(node.value.charAt(0)) !== "int")
                return false;
            else
                return true;
    }
    else
        return false;
    
    /*for(var i=0; i<node.children[1].value.length; i++) {
        
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
        
    }*/
    
}

function evaluateString(node) {
    
    //Does this need a better evaluation?
    if(node.value.charAt(0) === "\"") {
        return true;
    }
    
}

function idType(id) {
    
    //Stores location where semantic analysis was before searching through tables
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

function idScope(id) {
    
    //Stores location where semantic analysis was before searching through tables
    var nodeLocation = symbolTableTree.activeNode;
    
    do {
        
        for(var i=0; i<symbolTableTree.activeNode.table.length; i++) {
        //For every entry in the scope's table,
        //If the id was declared here then return the scope's node
            if(symbolTableTree.activeNode.table[i].id === id) {
                symbolTableTree.activeNode.table[i].assigned = true;
                var returnNode = symbolTableTree.activeNode;
                symbolTableTree.activeNode = nodeLocation;
                return returnNode;
            }

        }
        //Move up the tree to the current scope's parent
        symbolTableTree.activeNode = symbolTableTree.activeNode.parent;
        
    } while(symbolTableTree.activeNode !== null);
    
    symbolTableTree.activeNode = nodeLocation;
    return "null";
    
}

function markVariableAsUsed(id) {
    
    //Stores location where semantic analysis was before searching through tables
    var nodeLocation = symbolTableTree.activeNode;
    
    do {
        
        for(var i=0; i<symbolTableTree.activeNode.table.length; i++) {
        //For every entry in the scope's table,
        //If the id was declared here then mark the variable as used
            if(symbolTableTree.activeNode.table[i].id === id) {
                symbolTableTree.activeNode.table[i].used = true;
                symbolTableTree.activeNode = nodeLocation;
                return;
            }

        }
        //Move up the tree to the current scope's parent
        symbolTableTree.activeNode = symbolTableTree.activeNode.parent;
        
    } while(symbolTableTree.activeNode !== null);
    
    symbolTableTree.activeNode = nodeLocation;
    
}

function areUnassignedVariables(node) {
    //Returns position in token stream of first unassigned variable found, -1 if none found
    
    for(var i=0; i<node.table.length; i++) {
        if(node.table[i].assigned === false) {
            return node.table[i].position;
        }
    }
    for(var i=0; i<node.children.length; i++) {
        var test = areUnassignedVariables(node.children[i]);
        if(test !== -1)
            return test;
    }
    
    return -1;
    
}

function areUnusedVariables(node) {
    //Returns position in token stream of first unused variable found, -1 if none found
    //NEEDS TO LOOK INSIDE EXRESSIONS
    
    for(var i=0; i<node.table.length; i++) {
        if(node.table[i].used === false) {
            return node.table[i].position;
        }
    }
    for(var i=0; i<node.children.length; i++) {
        var test = areUnusedVariables(node.children[i]);
        if(test !== -1)
            return test;
    }
    
    return -1;
    
}

function isDuplicateDeclaration(id) {
    for(var i=0; i<symbolTableTree.activeNode.table.length; i++) {
    //For every entry in the scope's table,
    //If the id was declared before then return true
        if(symbolTableTree.activeNode.table[i].id === id) {
            symbolTableTree.activeNode = nodeLocation;
            return true;
        }

    }
    return false;
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