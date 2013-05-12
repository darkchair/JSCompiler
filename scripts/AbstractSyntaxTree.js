/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
//Notes---------
//Pre-order CLR
//Post order LRC

//Builds the syntax tree from the left with the grammer
function AbstractSyntaxTree(root) {
    
    //Members
    this.root = new ASTNode(null, "root");
    this.activeNode = null;
    
    //Functions
    this.addChild = function(value, position) {
        
        if(this.activeNode === null) {
            this.activeNode = this.root;   
        }
        var newN = new ASTNode(this.activeNode, value, position);
        this.activeNode.children.push(newN);
        this.activeNode = newN;
        
    };
    
    this.addExpression = function(expr, location) {
        
        
        if(expr.charAt(0) === "\"") { //If its a string expression
            this.addChild(expr, location);
            this.backToParent();
        }
        else if(expr.search(/\+/) !== -1 || expr.search("-") !== -1) //If its an int expression
            this.addIntExpression(expr, location);
        else if(expr.charAt(0) === "(") { //If its a boolean expression
            
        }
        else {//If its an id 
            this.addChild(expr, location);
            this.backToParent();
        }
        
    };
    
    this.addIntExpression = function(expr, location) {
        var returnPoint = this.activeNode;
        
        var locater = expr.length-1;
        while(locater >= 0) {
            
            if(locater === 0) {
                this.addChild(expr.charAt(locater), location);
                this.backToParent();
                locater--;
            }
            else if(isOp(expr.charAt(locater))) {
                this.addChild(expr.charAt(locater), location);
                this.addChild(expr.charAt(locater+1), location);
                this.backToParent();
                //this.addChild(expr.charAt(locater-1), location);
                locater--;
            }
            else if(isID(expr.charAt(locater))) {
                locater--;
                continue;
            }
            else if(isDigit(expr.charAt(locater))) {
                locater--;
                continue;
            }
            else {
                //Error
            }
            
        }
        
        this.activeNode = returnPoint;
        
    };
    
    this.backToParent = function() {
        
        if(this.activeNode.parent === null){
            //We're done?
            putMessage("uhoh");
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

            // If there are no children (i.e., leaf nodes)...
            if (!node.children || node.children.length === 0)
            {
                // ... note the leaf node.
                traversalResult += "[" + node.value + "]";
                traversalResult += "\n";
            }
            else
            {
                // There are children, so note these interior/branch nodes and ...
                traversalResult += "<" + node.value + "> \n";
                // .. recursively expand them.
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

function ASTNode (parent, value, position) {
    
    //Members
    this.parent = parent;
    this.value = value;
    this.scope = null;
    this.children = new Array();   
    this.position = position; //position in the sequence of tokens
    
}