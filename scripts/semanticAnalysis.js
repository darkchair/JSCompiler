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
    //Start with first 'real' node, usually a StatementBlock
    recordAndCheckNode(abstractSyntaxTree.root.children[0]);
    printSymbolTable();
}

function recordAndCheckNode(node) {
    
    if(node.value === "StatementBlock") {
        for(var i=0; i<node.children.length; i++) {
            semanticAnalysisScope++;
            recordAndCheckNode(node.children[i]);
            semanticAnalysisScope--;
        }
    }
    
    if(node.value === "Declaration") {
        var type = node.children[0].value;
        var id = node.children[1].value;
        symbolTables[semanticAnalysisScope].pushSymbol(type, id, 0);
        return;
    }
    
    if(node.value === "Assign") {
        var type = evaluateExpression(node);
        if(idType(node.children[0].value) === type)
            return;
        else
            throw new SemanticError("Error: Type mismatch at line ");
        
    }
    
    if(node.value === "PrintExpression") {
        
    }
    
}

function evaluateExpression(node) {
    
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
           (node.children[1].value.charCodeAt(i) >= 48 && node.children[1].value.charCodeAt(i) <= 57)
          ) {
            continue;
        }
        else if(node.children[1].value.charCodeAt(i) >= 97 && node.children[1].value.charCodeAt(i) <= 122) {
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
    
    //Does this nees a better evaluation?
    if(node.children[1].value.charAt(0) === "\"") {
        return true;
    }
    
}

function idValue(id) {
    
    for(var i=symbolTables.length - 1; i >= 0; i--) {
        for(var j=0; j<symbolTables[i].length; j++) {
            if(symbolTables[i].table[j].id === id) {
                return symbolTables[i].table[j].id;
            }
        }
    }
    return "n/a";
    
}

function idType(id) {
    
    for(var i=symbolTables.length - 1; i >= 0; i--) {
        for(var j=0; j<symbolTables[i].table.length; j++) {
            if(symbolTables[i].table[j].id === id) {
                return symbolTables[i].table[j].type;
            }
        }
    }
    return "null";
    
}


function printSymbolTable() {
    for(var i = symbolTables.length - 1; i >= 0; i--) {
        document.getElementById("symbolTable").value += "-- Scope " + i + " --\n";
        for(var j=0; j<symbolTables[i].table.length; j++) {
            document.getElementById("symbolTable").value += 
                    symbolTables[i].table[j].type + " " + symbolTables[i].table[j].id + "\n";
        }
    }
}