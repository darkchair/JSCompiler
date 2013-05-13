/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


var memory = new Array();
var heap = new Array();
var declarationTable = new Array();
var jumpTable = new Array();
var stringTable = new Array();

var codeGenScopeTracker = -2;
var firstScopeNode = true;
var memorySize = 255;//One extra space at very end for holding values temporarily
                    //(for holding values so they can be negated for subtraction
                    //and for comparing two variables)
                    
var memoryOutputType = "plain";

function generateCode() {
    putMessage("\n-------------------");
    putMessage("Generating Code ...");
    
    //Start with first 'real' node, usually a StatementBlock
    //Traverse the tree, adding code to memory and table entries to tables
    traverseTree(abstractSyntaxTree.root.children[0]);
    memory.push("00");
    //Fill in temp locations
    for(var i=0; i<declarationTable.length; i++) {
        for(var j=0; j<memory.length; j++) {
            if(memory[j] === declarationTable[i].tempName) {
                memory[j] = memory.length.toString(16);
                memory[j+1] = "00";
            }
        }
        memory.push("00");
    }
    
    while(memory.length < memorySize-heap.length)
        memory.push("00");
    for(var i=heap.length-1; i>=0; i--)
        memory.push(heap[i]);
    memory.push("00");
    printMemory();
    
}

function traverseTree(node) {
    
    if(node.value === "StatementBlock") {
        
        //codeGenScopeTracker++;
        //if(codeGenScopeTracker >= 0)
        //    symbolTableTree.activeNode = symbolTableTree.children[codeGenScopeTracker];
        var i=0
        
        if(!firstScopeNode) {
            symbolTableTree.activeNode = symbolTableTree.activeNode.children[i];
        }
        for(; i<node.children.length; i++) {
            if(firstScopeNode) {
                firstScopeNode = false;
                traverseTree(node.children[i]);
                firstScopeNode = true;
            }
            else {
                traverseTree(node.children[i]);
            }
        }
        //symbolTableTree.activeNode = symbolTableTree.activeNode.parent;
        if(symbolTableTree.activeNode.parent !== null)
            symbolTableTree.activeNode = symbolTableTree.activeNode.parent;
        //firstScopeNode = true;
    }
    
    else if(node.value === "Declaration") {
        var id = node.children[1].value;
        declarationTable.push(
                new DeclarationTableEnrty("T"+(declarationTable.length),
                                            id, node.children[1].scopeId)
        );
        if(node.children[0].value !== "string")
            memory.push("A9", "00", "8D", "T"+(declarationTable.length-1), "??");
    }
    
    else if(node.value === "Assign") {
        var id = node.children[0].value;
        var tempName = getTempNameOfId(id, node.children[0].scopeId);
        var curType = idType(id);
        
        /*for(var i=0; i<node.scope.table.length; i++){
            if(node.scope.table[i].id === id){
                curType = node.scope.table[i].type;
            }
        }*/
        
        if(curType === "string") {
            if(node.children[1].value === "+") {
                
            }
            memory.push("A9", ((memorySize-1-heap.length) - (node.children[1].value.length-2)).toString(16), "8D",
                        tempName, "??"); //-2 because of quote marks
            heap.push("00");
            for(var i=node.children[1].value.length-1-1; i>=1; i--) { //Skip the quote marks
                heap.push( node.children[1].value.charCodeAt(i).toString(16) );//put it in backwords, we will fix it later
            }
        }
        //Load accumulator with data (skips strings)
        loadAccumulator(node.children[1], tempName);
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
        if(node.children[0].scopeId !== null) { //node.scope is filled when the argument is an id
            memory.push("AC", getTempNameOfId(node.children[0].value, node.children[0].scopeId), "??", "A2");
            if(idType(node.children[0].value) === "string")
                memory.push("02", "FF");
            else
                memory.push("01", "FF");
        }
        else {
            
            if(node.children[0].value === "+" || node.children[0].value === "-") {
                //Load accumulator with data (skips strings)
                loadAccumulator(node.children[0]);
                memory.push("8D", "ff", "00", "AC", "ff", "00", "A2", "01", "FF");
            }
            else if(node.children[0].value.charAt(0) === "\"") {
                //Not sure
            }
            
            
        }
    }
    
    else if(node.value === "WhileStatement") {
        
        
        node = node.children[0];
        
        //Go down tree until you find the deepest BooleanExpr
        while(node.children[1].value === "Equals?") {
            node = node.children[1];
        }
        
        var startLocation = memory.length;
        var firstJump = jumpTable.length;
        //Set Z flag to true
        memory.push("A9", "00", "8D", "ff", "00", "A2", "00", "EC", "ff", "00");
        //Load first expression's value and store it in temp memory
        loadAccumulator(node.children[0]);
        memory.push("8D", "ff", "00");
        //Load second expression's value
        loadXReg(node.children[1]);
        //Compare the two values and set Z flag
        memory.push("EC", "ff", "00", "D0", "J"+(jumpTable.length));
        jumpTable.push( new JumpTableEnrty("J"+(jumpTable.length), 0) );

        node = node.parent;
        
        while(node.value !== "WhileStatement") {
            //Load first expression's value and store it in temp memory
            loadAccumulator(node.children[0]);
            memory.push("8D", "ff", "00");
            //Load second expression's value
            loadXReg(node.children[1]);
            //Compare the two values and set Z flag
            memory.push("EC", "ff", "00", "D0", "J"+(jumpTable.length));
            jumpTable.push( new JumpTableEnrty("J"+(jumpTable.length), 0) );
            
            node = node.parent;
        }
        
        //Load memory for block
        traverseTree(node.children[1]);
        
        //Set Z flag to false
        memory.push("A9", "01", "8D", "ff", "00", "A2", "00", "EC", "ff", "00");
        //Jump to beginning
        memory.push("D0", (256-(memory.length-startLocation)-2).toString(16));
        //Update jumps
        for(var j=firstJump; j<jumpTable.length; j++) {
            for(var i=0; i<memory.length; i++) {
                if(memory[i] === "J" + j) {
                    memory[i] = (memory.length - i - 1).toString(16);
                }
            }
        }
        
        

        /*//Going back up the tree, build the jump statements
        while(node.value !== "IfStatement") {

            //Check both arguments, if one of them is immediate then load it, if both are, put other in temp storage
            if(!isID(node.children[0].value)) {
                if(!isID(node.children[1].value)) {
                    if(node.children[0].value === "true") {
                        memory.push("A9", "01", "8D", "ff", "00");
                        memory.push("A2");
                        if(node.children[1].value === "true")
                            memory.push("01");
                        else if(node.children[1].value === "false")
                            memory.push("00");
                        memory.push("EC", "ff", "00");
                    }
                    else if(node.children[0].value === "false") {
                        memory.push("A9", "00", "8D", "ff", "00");
                        memory.push("A2");
                        if(node.children[1].value === "true")
                            memory.push("01");
                        else if(node.children[1].value === "false")
                            memory.push("00");
                        memory.push("EC", "ff", "00");
                    }
                    else if(node.children[0].value === "+" || node.children[0].value === "-") {
                        generateExpression(node.children[1], tempName);
                        memory.push("8D", "ff", "00");
                        memory.push("AE", "ff", "00");
                    }


                    jumpTable.push( new JumpTableEnrty("J"+(jumpTable.length), 0) );
                    memory.push("D0", "J"+(jumpTable.length));

                }
                else {

                }
            }
        }*/
        
        
        
    }
    
    else if(node.value === "IfStatement") {
        
        node = node.children[0];
        
        //Go down tree until you find the deepest BooleanExpr
        while(node.children[1].value === "Equals?") {
            node = node.children[1];
        }
        
        var firstJump = jumpTable.length;
        
        //Load first expression's value and store it in temp memory
        loadAccumulator(node.children[0]);
        memory.push("8D", "ff", "00");
        //Load second expression's value
        loadXReg(node.children[1]);
        //Compare the two values and set Z flag
        memory.push("EC", "ff", "00", "D0", "J"+(jumpTable.length));
        jumpTable.push( new JumpTableEnrty("J"+(jumpTable.length), 0) );

        node = node.parent;
        
        while(node.value !== "IfStatement") {
            //Load first expression's value and store it in temp memory
            loadAccumulator(node.children[0]);
            memory.push("8D", "ff", "00");
            //Load second expression's value
            loadXReg(node.children[1]);
            //Compare the two values and set Z flag
            memory.push("EC", "ff", "00", "D0", "J"+(jumpTable.length));
            jumpTable.push( new JumpTableEnrty("J"+(jumpTable.length), 0) );
            
            node = node.parent;
        }
        
        
        //Load memory for block
        traverseTree(node.children[1]);
        //Update jump points
        for(var j=firstJump; j<jumpTable.length; j++) {
            for(var i=0; i<memory.length; i++) {
                if(memory[i] === "J" + j) {
                    memory[i] = (memory.length - i - 1).toString(16);
                }
            }
        }
        
    }
    
}

function getTempNameOfId(id, scopeId) {
    
    for(var i=0; i<declarationTable.length; i++) {
        if(declarationTable[i].id === id && declarationTable[i].scopeId === scopeId)
            return declarationTable[i].tempName;
    }
    //Else error?
}

function loadAccumulator(node) {
    //Inserts code into memory for loading the values as described by the expression into the accumulator
    
    if(node.children.length === 0) {
        if(node.value === "true") {
            memory.push("A9", "01");
        }
        else if(node.value === "false") {
            memory.push("A9", "00");
        }
        else if(isID(node.value)) {
            memory.push("AD", getTempNameOfId(node.value, node.scopeId), "??");
        }
        
        else if(node.value.charCodeAt(0) >= 48  && node.value.charCodeAt(0) <= 57) {
            memory.push("A9", parseInt(node.value).toString(16));
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
        if(isID(buildString.charAt(0))) {
            memory.push("6D", getTempNameOfId(buildString.charAt(0), idScope(buildString.charAt(0)).scopeId), "??");
        }
        else {
            partValue += parseInt(buildString.charAt(0));
        }
        for(var i=buildString.length-1; i>=1; i--) {
            if((buildString.charCodeAt(i) >= 48  && buildString.charCodeAt(i) <= 57))
                continue;
            else if(buildString.charAt(i) === "+") {
                /*if(isID(buildString.charAt(i-1))) {
                    memory.push("6D", getTempNameOfId(buildString.charAt(i+1), buildString.charAt(buildString.length+1).scopeId), "??");
                }
                else {*/
                    partValue += parseInt(buildString.charAt(i+1));
                //}
            }
            else if(buildString.charAt(i) === "-") {
                if(isID(buildString.charAt(i-1))) {
                    memory.push("6D", getTempNameOfId(buildString.charAt(i+1), buildString.charAt(buildString.length+1).scopeId), "??");
                    //memory.push
                }
                else {
                    partValue -= parseInt(buildString.charAt(i+1));
                }
            }
            else {
                //Theres a problem?
            }
        }
        memory.splice(insertLocation, 0, "A9", parseInt(partValue).toString(16));
        
    }
    else if(node.value === "Equals?") {
        //Go down tree until you find the deepest BooleanExpr
        while(node.children[1].value === "Equals?") {
            node = node.children[1];
        }
        
        while(node.value !== "IfStatement") {
            
        }

        /*//Going back up the tree, build the jump statements
        while(node.value !== "IfStatement") {

            //Check both arguments, if one of them is immediate then load it, if both are, put other in temp storage
            if(!isID(node.children[0].value)) {
                if(!isID(node.children[1].value)) {
                    if(node.children[0].value === "true") {
                        memory.push("A9", "01", "8D", "ff", "00");
                        memory.push("A2");
                        if(node.children[1].value === "true")
                            memory.push("01");
                        else if(node.children[1].value === "false")
                            memory.push("00");
                        memory.push("EC", "ff", "00");
                    }
                    else if(node.children[0].value === "false") {
                        memory.push("A9", "00", "8D", "ff", "00");
                        memory.push("A2");
                        if(node.children[1].value === "true")
                            memory.push("01");
                        else if(node.children[1].value === "false")
                            memory.push("00");
                        memory.push("EC", "ff", "00");
                    }
                    else if(node.children[0].value === "+" || node.children[0].value === "-") {
                        generateExpression(node.children[1], tempName);
                        memory.push("8D", "ff", "00");
                        memory.push("AE", "ff", "00");
                    }


                    jumpTable.push( new JumpTableEnrty("J"+(jumpTable.length), 0) );
                    memory.push("D0", "J"+(jumpTable.length));

                }
                else {

                }
            }
        }*/
    }
    else {
        //Not sure if there are other cases, might be error
    }
    
}

function loadXReg(node) {
    //Inserts code into memory for loading the values as described by the expression into the X register
    
    if(node.children.length === 0) {
        if(node.value === "true") {
            memory.push("A2", "01");
        }
        else if(node.value === "false") {
            memory.push("A2", "00");
        }
        else if(isID(node.value)) {
            memory.push("AE", getTempNameOfId(node.value, node.scopeId), "??");
        }
        else if(node.value.charCodeAt(0) >= 48  && node.value.charCodeAt(0) <= 57) {
            memory.push("A2", parseInt(node.value).toString(16));
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
        if(isID(buildString.charAt(0))) {
            memory.push("AE", getTempNameOfId(buildString.charAt(0), symbolTableTree.activeNode.scopeId), "??");
        }
        else {
            partValue += parseInt(buildString.charAt(buildString.length-1));
        }
        for(var i=buildString.length-2; i>=0; i--) {
            if((buildString.charCodeAt(i) >= 48  && buildString.charCodeAt(i) <= 57))
                continue;
            else if(buildString.charAt(i) === "+") {
                if(isID(buildString.charAt(i-1))) {
                    memory.push("6D", getTempNameOfId(buildString.charAt(i-1), buildString.charAt(buildString.length-1).scopeId), "??");
                }
                else {
                    partValue += parseInt(buildString.charAt(i-1));
                }
            }
            else if(buildString.charAt(i) === "-") {
                if(isID(buildString.charAt(i-1))) {
                    memory.push("6D", getTempNameOfId(buildString.charAt(i-1), buildString.charAt(buildString.length-1).scopeId), "??");
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
        memory.splice(insertLocation, 0, "A2", parseInt(partValue).toString(16));
        
    }
    else if(node.value === "Equals?") {
        //Go down tree until you find the deepest BooleanExpr
        while(node.children[1].value === "Equals?") {
            node = node.children[1];
        }
        
        while(node.value !== "IfStatement") {
            
        }

        /*//Going back up the tree, build the jump statements
        while(node.value !== "IfStatement") {

            //Check both arguments, if one of them is immediate then load it, if both are, put other in temp storage
            if(!isID(node.children[0].value)) {
                if(!isID(node.children[1].value)) {
                    if(node.children[0].value === "true") {
                        memory.push("A9", "01", "8D", "ff", "00");
                        memory.push("A2");
                        if(node.children[1].value === "true")
                            memory.push("01");
                        else if(node.children[1].value === "false")
                            memory.push("00");
                        memory.push("EC", "ff", "00");
                    }
                    else if(node.children[0].value === "false") {
                        memory.push("A9", "00", "8D", "ff", "00");
                        memory.push("A2");
                        if(node.children[1].value === "true")
                            memory.push("01");
                        else if(node.children[1].value === "false")
                            memory.push("00");
                        memory.push("EC", "ff", "00");
                    }
                    else if(node.children[0].value === "+" || node.children[0].value === "-") {
                        generateExpression(node.children[1], tempName);
                        memory.push("8D", "ff", "00");
                        memory.push("AE", "ff", "00");
                    }


                    jumpTable.push( new JumpTableEnrty("J"+(jumpTable.length), 0) );
                    memory.push("D0", "J"+(jumpTable.length));

                }
                else {

                }
            }
        }*/
    }
    else {
        //Not sure if there are other cases, might be error
    }
    
}

function DeclarationTableEnrty(tName, id, scopeId) {
    
    this.tempName = tName;
    this.id = id;
    this.scopeId = scopeId;
      
}

function JumpTableEnrty(tName, offset) {
    
    this.tempName = tName;
    this.offset = offset;
      
}


function printMemory() {
    
    document.getElementById("outputCode").value = "";
    
    if(memoryOutputType === "plain") {
        for(var i=0; i<memory.length; i+=8) {
            for(var j=i; j<i+8; j++) {
                if(memory[j].length < 2)
                    memory[j] = "0" + memory[j];
                document.getElementById("outputCode").value += memory[j] + " ";
            }
        }
    }
    
    else if(memoryOutputType === "indexed") {
        for(var i=0; i<memory.length; i+=8) {
            document.getElementById("outputCode").value += "[" + (i).toString(16) + "]";
            for(var j=i; j<i+8; j++) {
                document.getElementById("outputCode").value += memory[j] + " ";
            }
            document.getElementById("outputCode").value += "\n";
        }
    }
    
}