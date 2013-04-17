/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

function SymbolTableTree() {
    
    //Members
    this.root = new SymbolTable(null, -1);
    this.activeNode = this.root;
    this.idTracker = 0;
    
    //Functions
    this.addChild = function() {
        if(this.root.scopeId === -1) {
            this.root = new SymbolTable(null, this.idTracker);
            this.activeNode = this.root;
            this.idTracker++;
        }
        else {
            var newN = new SymbolTable(this.activeNode, this.idTracker);
            this.activeNode.children.push(newN);
            this.activeNode = newN;
            this.idTracker++;
        }
        
    };
    
    this.backToParent = function() {
        
        if(this.activeNode.parent === null){
            //We're done?
            return;
        }
            
        this.activeNode = this.activeNode.parent;
        
    };
    
    // Return a string representation of the tree.
    this.toString = function() {
        // Initialize the result string.
        var traversalResult = "";

        // Recursive function to handle the expansion of the nodes.
        function expand(node, depth)
        {
            // Space out based on the current depth so
            // this looks at least a little tree-like.
            for (var i = 0; i < depth; i++)
            {
                traversalResult += "-";
            }
            traversalResult += "< Scope " + node.scopeId + " > \n";
            for(var i=0; i<node.table.length; i++) {
                traversalResult += "[" + node.table[i].type + " " +
                                    node.table[i].id + "] ";
            }
            traversalResult += "\n";
            // If there are no children (i.e., leaf nodes)...
            if (!node.children || node.children.length === 0)
            {
                return;
            }
            else
            {
                // There are children, so note these interior/branch nodes and 
                // recursively expand them.
                for (var i = 0; i < node.children.length; i++)
                {
                    expand(node.children[i], depth + 1);
                }
            }
        }
        // Make the initial call to expand from the root.
        expand(this.root, 0);
        // Return the result.
        return traversalResult;
    };
    
}

function SymbolTable(parent, id) {
    
    //Members
    this.parent = parent;
    this.table = new Array();
    this.children = new Array();
    this.scopeId = id;
    
    //Functions
    this.pushSymbol = function(type, id, lineNum) {
        
        var newEntry = new SymbolTableEntry(type, id, lineNum);
        this.table.push(newEntry);
        
    };
    
}

function SymbolTableEntry(type, id, position) {
    
    this.type = type;
    this.id = id;
    this.position = position;
    this.assigned = false;
    this.positionPointer = null;
    
    //A type and id of 'seperator' indicates a division between parallel scopes
    //  at the same depth
    
}


