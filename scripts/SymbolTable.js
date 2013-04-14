/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


function SymbolTableEntry(type, id, lineNum) {
    
    this.type = type;
    this.id = id;
    this.lineNum = lineNum;
    
}

function SymbolTable() {
    
    //Members
    this.table = new Array();
    
    //Functions
    this.pushSymbol = function(type, id, lineNum) {
        
        var newEntry = new SymbolTableEntry(type, id, lineNum);
        this.table.push(newEntry);
        
    };
    
}


