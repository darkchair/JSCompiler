/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


var memory = new Array();
var heap = new Array();
var declarationTable = new Array();
var jumpTable = new Array();
var stringTable = new Array();

var codeGenScopeTracker = 0;
var memorySize = 255;//One extra space at very end for holding values temporarily
                    //(for holding values so they can be negated for subtraction)

function generateCode() {
    putMessage("\n-------------------");
    putMessage("Generating Code ...");
    
    //Start with first 'real' node, usually a StatementBlock
    //Traverse the tree, adding code to memory and table entries to tables
    traverseTree(abstractSyntaxTree.root.children[0]);
    memory.push("00");
    //Fill in temp locations
    
    while(memory.length < memorySize-heap.length)
        memory.push("00");
    for(var i=0; i<heap.length; i++)
        memory.push(heap[i]);
    memory.push("00");
    document.getElementById("outputCode").value += memory;
    
}

function traverseTree(node) {
    
    if(node.value === "StatementBlock") {
        codeGenScopeTracker++;
        for(var i=0; i<node.children.length; i++) {
            traverseTree(node.children[i]);
        }
        codeGenScopeTracker--;
    }
    
    else if(node.value === "Declaration") {
        var id = node.children[1].value;
        declarationTable.push(
                new DeclarationTableEnrty("T"+(declarationTable.length),
                                            id, codeGenScopeTracker)
        );
        if(node.children[0].value !== "string")
            memory.push("A9", "00", "8D", "T"+(declarationTable.length-1), "??");
    }
    
    else if(node.value === "Assign") {
        var id = node.children[0].value;
        var tempName = getTempNameOfId(id, codeGenScopeTracker);
        var curType = "";
        for(var i=0; i<node.scope.table.length; i++){
            if(node.scope.table[i].id === id){
                curType = node.scope.table[i].type;
            }
        }
        
        if(curType === "string") {
            for(var i=1; i<node.value.length-1; i++) { //Skip the quote marks
                heap.push( node.value.charCodeAt(i).toString(16) );//put it in backwords, we will fix it later
            }
            heap.push("00");
            memory.push("A9", ((memorySize-1-heap.length) - (node.value.length+1)).toString(16), "8D",
                        tempName, "??");
        }
        //Load accumulator with data (skips strings)
        generateExpression(node.children[1], tempName);
        //Store it in memory
        if(curType !== "string")
            memory.push("8D", tempName, "??");
        
    }
    
    else if(node.value === "PrintExpression") {
        //Load accumulator with data
        //Store temp memory
        //Load into Y reg
        //Set X flag
        //System call
        if(node.scope === null) { //node.scope is not filled when the argument is an id
            memory.push("AC", getTempNameOfId(node.children[0].value, codeGenScopeTracker), "??", "A2", "02", "FF");
        }
        else {
            
            if(node.children[0] === "+" || node.children[0] === "-") {
                //Load accumulator with data (skips strings)
                generateExpression(node.children[1], tempName);
                memory.push("8D", "FF", "00", "AC", "FF", "00", "A2", "01", "FF");
            }
            
            
        }
    }
    
}

function getTempNameOfId(id, scope) {
    
    for(var i=0; i<declarationTable.length; i++) {
        if(declarationTable[i].id === id && declarationTable[i].scope === scope)
            return declarationTable[i].tempName;
    }
    //Else error?
}

function generateExpression(node, tempName) {
    //Inserts code into memory for loading the values as described by the expression
    
    if(node.children.length === 0) {
        if(isID(node.value)) {
            memory.push("AD", getTempNameOfId(node.value, codeGenScopeTracker), "??");
        }
        else if(node.value.charCodeAt(0) >= 48  && node.value.charCodeAt(0) <= 57) {
            memory.push("A9", parseInt(node.value).toString(16), "8D", getTempNameOfId(node.parent.children[0].value));
        }
        else if(node.value.charAt(0) === "\"") {
            
        }
    }
    else if(node.value === "+" || node.value === "-") {
        //Only covers addition and subtraction, and no parenthesis
        
        var buildString = "";
        while(true) { //Not sure how to implement this more "cleanly"
            if(node.value === "+" || node.value === "-") {
                buildString += "" + node.children[0].value + node.value;
                node = node.children[1];
            }
            else {
                buildString += node.value;
                break;
            }
        }
        
        var partValue = 0;
        var insertLocation = memory.length;
        if(isID(buildString.charAt(buildString.length-1))) {
            memory.push("AD", getTempNameOfId(buildString.charAt(buildString.length-1), codeGenScopeTracker), "??");
        }
        else {
            partValue += parseInt(buildString.charAt(buildString.length-1));
        }
        for(var i=buildString.length-2; i>=0; i--) {
            if((buildString.charCodeAt(i) >= 48  && buildString.charCodeAt(i) <= 57))
                continue;
            else if(buildString.charAt(i) === "+") {
                if(isID(buildString.charAt(i-1))) {
                    memory.push("6D", getTempNameOfId(buildString.charAt(i-1), codeGenScopeTracker), "??");
                }
                else {
                    partValue += parseInt(buildString.charAt(i-1));
                }
            }
            else if(buildString.charAt(i) === "-") {
                if(isID(buildString.charAt(i-1))) {
                    memory.push("6D", getTempNameOfId(buildString.charAt(i-1), codeGenScopeTracker), "??");
                    //memory.push
                }
                else {
                    partValue -= parseInt(buildString.charAt(i-1));
                }
            }
            else {
                //Theres a problem?
            }
        }
        memory.splice(insertLocation, 0, "A9", parseInt(partValue).toString(16));
        
    }
    else {
        //Not sure if there are other cases, might be error
    }
    
}

function DeclarationTableEnrty(tName, id, scope) {
    
    this.tempName = tName;
    this.id = id;
    this.scope = scope;
      
}