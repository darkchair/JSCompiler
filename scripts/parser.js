/* parser.js */

var inQuotes = false;
var expressionHolder = "";

function parse() {
    putMessage("\n-------------------");
    putMessage("Parsing ...");
    // Grab the next token.
    currentToken = consumeNextToken();
    // A valid parse derives the 'program' production, so begin there.
    parseProgram();
    // Report the results.
    putMessage("\nParsing found " + errorCount + " error(s).\n" +
               "Parsing found " + warningCount + " warning(s).");
    printAST();
}

function parseProgram() {
    parseStatement();
    checkToken("end");
    if (tokenIndex < tokens.length && errorCount === 0) {
        warningCount++;
        putMessage("Warning: Tokens found after EndOfFile");
    }
}

function parseStatement() {
    if (currentToken.type === "PrintStatement") {
        parsePrint();
    }
    else if (currentToken.type === "char" &&
            peekNextToken().type === "equal") {
        parseIDAssign();
    }
    else if (currentToken.type === "type") {
        parseVarDecleration();
    }
    else if (currentToken.type === "bOpen") {
        if(tokens[tokenIndex-1].type === "bOpen") {
            scope++;
        }
        checkToken("bOpen");
        abstractSyntaxTree.addChild("StatementBlock", tokenIndex-1);
        parseStatementList();
        if(tokens[tokenIndex-1].type === "bClose") {
            scope--;
        }
        checkToken("bClose");
        abstractSyntaxTree.backToParent();
    }
    else if (currentToken.type === "WhileStatement") {
        parseWhileStatement();
    }
    else if (currentToken.type === "IfStatement") {
        parseIfStatement();
    }
    else {
        errorCount++;
        var index = tokenIndex - 1;
        putMessage("ERROR: No valid statement found at position " + index + ".");
    }
}

function parsePrint() {
    abstractSyntaxTree.addChild("PrintExpression", tokenIndex-1);
    
    checkToken("PrintStatement");
    checkToken("pOpen");
    expressionHolder = ""; var expLocation = tokenIndex-1;
    parseExpression();
    abstractSyntaxTree.addExpression(expressionHolder, expLocation);
    //abstractSyntaxTree.backToParent(); already handled in addExpression()
    checkToken("pClose");
    
    abstractSyntaxTree.backToParent();
}

function parseIDAssign() {
    abstractSyntaxTree.addChild("Assign", tokenIndex);
    
    abstractSyntaxTree.addChild(tokens[tokenIndex-1].value, tokenIndex-1);
    abstractSyntaxTree.backToParent();
    checkToken("char");
    checkToken("equal");
    expressionHolder = ""; var expLocation = tokenIndex-1;
    parseExpression();
    abstractSyntaxTree.addExpression(expressionHolder, expLocation);
    //abstractSyntaxTree.backToParent(); already handled in addExpression()
    
    abstractSyntaxTree.backToParent();
}

function parseStatementList() {
    if (currentToken.type === "bClose") {
        //End of the statement block
    }
    else if(tokenIndex !== locationTracker){
        locationTracker = tokenIndex;
        parseStatement();
        parseStatementList();
    }
    else {
        //Parse found an unparsable statement
    }
}

function parseExpression() {
    if (currentToken.type === "digit") {
        parseIntExpression();
    }
    else if (currentToken.type === "quote") {
        parseStringExpression();
    }
    else if (currentToken.type === "char") {
        checkToken("char");
        expressionHolder += tokens[tokenIndex-2].value;
    }
    else if (currentToken.type === "pOpen" || currentToken.type === "boolVal") {
        parseBooleanExpression();
    }
}

function parseIntExpression() {
    checkToken("digit");
    expressionHolder += tokens[tokenIndex-2].value;
    if (currentToken.type === "op") {
        checkToken("op");
        expressionHolder += tokens[tokenIndex-2].value;
        parseExpression();
    }
}

function parseStringExpression() {
    checkToken("quote");
    expressionHolder += "\"";
    parseCharList();
    checkToken("quote");
    expressionHolder += "\"";
}

function parseBooleanExpression() {
    if(currentToken.type === "pOpen") {
        abstractSyntaxTree.addChild("Equals?", tokenIndex-1);
        
        checkToken("pOpen");
        expressionHolder = ""; var expLocation = tokenIndex-1;
        parseExpression();
        abstractSyntaxTree.addExpression(expressionHolder, expLocation);
        checkToken("equal");checkToken("equal");
        expressionHolder = ""; expLocation = tokenIndex-1;
        parseExpression();
        abstractSyntaxTree.addExpression(expressionHolder, expLocation);
        checkToken("pClose");
        
        abstractSyntaxTree.backToParent();
    }
    else if(currentToken.type === "boolVal") {
        expressionHolder += currentToken.value;
        checkToken("boolVal");
    }
}

function parseCharList() {
    if(currentToken.type === "char")
    {
        checkToken("char");
        expressionHolder += tokens[tokenIndex-2].value;
        if (currentToken.type === "char" || currentToken.type === "space") {
            parseCharList();
        }
    }
    else if(currentToken.type === "space")
    {
        checkToken("space");
        expressionHolder += tokens[tokenIndex-2].value;
        if (currentToken.type === "char" || currentToken.type === "space") {
            parseCharList();
        }
    }
    else if(currentToken.type === "\"")
    {
        //Exit the loop
    }
}

function parseVarDecleration() {
    abstractSyntaxTree.addChild("Declaration", tokenIndex-1);
    
    checkToken("type");
    var type = tokens[tokenIndex-2].value;
    abstractSyntaxTree.addChild(type, tokenIndex-2);
    abstractSyntaxTree.backToParent();
    checkToken("char");
    abstractSyntaxTree.addChild(tokens[tokenIndex-2].value, tokenIndex-2);
    abstractSyntaxTree.backToParent();
    
    abstractSyntaxTree.backToParent();
}

function parseWhileStatement() {
    abstractSyntaxTree.addChild("WhileStatement", tokenIndex-1);
    
    checkToken("WhileStatement");
    parseBooleanExpression();
    checkToken("bOpen");
    abstractSyntaxTree.addChild("StatementBlock", tokenIndex-1);
    parseStatementList();
    checkToken("bClose");
    abstractSyntaxTree.backToParent();
    
    abstractSyntaxTree.backToParent();
}

function parseIfStatement() {
    
    abstractSyntaxTree.addChild("IfStatement", tokenIndex-1);
    
    checkToken("IfStatement");
    parseBooleanExpression();
    checkToken("bOpen");
    abstractSyntaxTree.addChild("StatementBlock", tokenIndex-1);
    parseStatementList();
    checkToken("bClose");
    abstractSyntaxTree.backToParent();
    
    abstractSyntaxTree.backToParent();
    
}

//-----------------------------------------------------------------------

function peekNextToken() {
    var thisToken = EOF;    // Let's assume that we're at the EOF.
    if (tokenIndex < tokens.length) {
        // If we're not at EOF, then return the next token in the stream.
        thisToken = tokens[tokenIndex];
    }
    return thisToken;
} 

function consumeNextToken() {
    var thisToken = EOF;    // Let's assume that we're at the EOF.
    if (tokenIndex < tokens.length) {
        // If we're not at EOF, then return the next token in the stream and advance the index.
        thisToken = tokens[tokenIndex];
        putMessage("Current token:" + printToken(thisToken));
        tokenIndex++;
    }
    return thisToken;
}

function idIsFree(idValue) { //Not needed I think
    for(var i=0; i<symbolTable.length; i++)
    {
        if(symbolTable[i] === idValue)
        {
            return false;
        }
    }
    return true;
}

function printToken(token)
{
    return "[" + token.type + " , " + token.value + "]";
}



function checkToken(expectedKind) {
    // Validate that we have the expected token kind and et the next token.
    switch (expectedKind) {
        case "type": putMessage("expecting a type");
            if (currentToken.value === "int" || currentToken.value === "string") {
                putMessage("Got a type!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not a type. Error at position " + tokenIndex + ".");
            }
            break;
        case "digit": putMessage("Expecting a digit");
            if (currentToken.value.charCodeAt(0) >= 48 && currentToken.value.charCodeAt(0) <= 57) {
                putMessage("Got a digit!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not a digit.  Error at position " + tokenIndex + ".");
            }
            break;
        case "boolVal": putMessage("Expecting a boolean");
            if (currentToken.value === "true" || currentToken.value === "false") {
                putMessage("Got a boolean!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not a boolean.  Error at position " + tokenIndex + ".");
            }
            break;
        case "op": putMessage("Expecting an operator");
            if (currentToken.value === "+" || currentToken.value === "-") {
                putMessage("Got an operator!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not an operator.  Error at position " + tokenIndex + ".");
            }
            break;
        case "id": putMessage("Expecting id");
            if (currentToken.value.charCodeAt(0) >= 97 && currentToken.value.charCodeAt(0) <= 122) {//If its a lower-case letter
                putMessage("Got an id!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not an id.  Error at position " + tokenIndex + ".");
            }
            break;
        case "char": putMessage("Expecting character");
            if (currentToken.value.charCodeAt(0) >= 97 && currentToken.value.charCodeAt(0) <= 122) {//If its a lower-case letter
                putMessage("Got a character!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not a character.  Error at position " + tokenIndex + ".");
            }
            break;
        case "space": putMessage("Expecting space");
            if (currentToken.value === " ") {
                putMessage("Got a space!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not a space.  Error at position " + tokenIndex + ".");
            }
            break;
        case "equal": putMessage("Expecting equal sign");
            if (currentToken.value === "=") {
                putMessage("Got an equal sign!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not an equal sign.  Error at position " + tokenIndex + ".");
            }
            break;
        case "end": putMessage("Expecting EOF");
            if (currentToken.value === EOF) {
                putMessage("Got an EOF!");
            }
            else {
                if(tokenIndex === tokens.length)
                {
                    warningCount++;
                    putMessage("Warning: EndOfFile not found at position " + tokenIndex + ".");
                    tokens.splice(tokenIndex, 0, new Token("end", "$"));
                }
                else
                {
                    errorCount++;
                    putMessage("ERROR: EOF not found at position " + tokenIndex + ".");
                }
            }
            break;
        case "PrintStatement": putMessage("Expecting print expression");
            if (currentToken.value === "print") {
                putMessage("Got a print expression!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not a print expression.  Error at position " + tokenIndex + ".");
            }
            break;
        case "pOpen": putMessage("Expecting an open parentheses");
            if (currentToken.value === "(") {
                putMessage("Got an open parentheses!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not an open parentheses.  Error at position " + tokenIndex + ".");
            }
            break;
        case "pClose": putMessage("Expecting a close parentheses");
            if (currentToken.value === ")") {
                putMessage("Got a close parentheses!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not a close parentheses.  Error at position " + tokenIndex + ".");
            }
            break;
        case "WhileStatement": putMessage("Expecting a while token");
            if (currentToken.value === "while") {
                putMessage("Got a while token!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not a while token.  Error at position " + tokenIndex + ".");
            }
            break;
        case "IfStatement": putMessage("Expecting an if token");
            if (currentToken.value === "if") {
                putMessage("Got an if token!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not an if token.  Error at position " + tokenIndex + ".");
            }
            break;
        case "bOpen": putMessage("Expecting open bracket");
            if (currentToken.value === "{") {
                putMessage("Got an open bracket!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not an open bracket.  Error at position " + tokenIndex + ".");
            }
            break;
        case "bClose": putMessage("Expecting close bracket");
            if (currentToken.value === "}") {
                putMessage("Got a close bracket!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not a close bracket.  Error at position " + tokenIndex + ".");
            }
            break;
        case "quote": putMessage("Expecting quote");
            if (currentToken.value === "\"") {
                putMessage("Got a quote!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not a quote.  Error at position " + tokenIndex + ".");
            }
            break;
        default: 
            errorCount++;
            putMessage("ERROR: Invalid Token Type at position " + tokenIndex + ".");
            break;
    }
    // Consume another token, having just checked this one, because that 
    // will allow the code to see what's coming next... a sort of "look-ahead".
    currentToken = consumeNextToken();
}

function Symbol(type, id)
{
    this.type = type;
    this.id = id;
}



/* Test Methods
function parseG() {
    // A G(oal) production can only be an E(xpression), so parse the E production.
    parseE();
}

function parseE() {
    // All E productions begin with a digit, so make sure that we have one.
    checkToken("digit");
    // Look ahead 1 char (which is now in currentToken because checkToken 
    // consumes another one) and see which E production to follow.
    if (currentToken != EOF) {
        // We're not done, we we expect to have an op.
        checkToken("op");
        parseE();
    }
    else {
        // There is nothing else in the token stream, 
        // and that's cool since E --> digit is valid.
        putMessage("EOF reached");
    }
}*/