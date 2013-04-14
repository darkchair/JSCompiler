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
    this.addChild = function(value) {
        
        if(this.activeNode === null) {
            this.activeNode = this.root;   
        }
        var newN = new ASTNode(this.activeNode, value);
        this.activeNode.children.push(newN);
        this.activeNode = newN;
        
    };
    
    this.addExpression = function(value) {
        
        for(var i=value.length; i>0; i--) {
            
            if(value.charAt(i) === "+" || value.charAt(i) === "-") {
                this.addChild(new ASTNode(this.activeNode, value.charAt(i)));
                //this.addChild
            }
            
        }
        
    }
    
    this.backToParent = function() {
        
        if(this.activeNode.root === null){
            //We're done?
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

function ASTNode (parent, value) {
    
    //Members
    this.parent = parent;
    this.value = value;
    this.children = new Array();   
    
}