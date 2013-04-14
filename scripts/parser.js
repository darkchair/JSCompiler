/* parser.js */

var inQuotes = false;

function parse() {
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
    //concreteSyntaxTree.addChild("Statement");
    if (currentToken.type === "pOpen") {
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
            if(symbolTables.length === scope) {
                symbolTables.push(new SymbolTable());
            }
        }
        checkToken("bOpen");
        abstractSyntaxTree.addChild("StatementBlock");
        //concreteSyntaxTree.addChild("StatementList");
        parseStatementList();
        //concreteSyntaxTree.backToParent();//?
        if(tokens[tokenIndex-1].type === "bClose") {
            scope--;
        }
        checkToken("bClose");
        abstractSyntaxTree.backToParent();
    }
    else {
        errorCount++;
        var index = tokenIndex - 1;
        putMessage("ERROR: No valid statement found at position " + index + ".");
    }
    //concreteSyntaxTree.backToParent();
}

function parsePrint() {
    abstractSyntaxTree.addChild("PrintExpression");
    
    checkToken("pOpen");
    //concreteSyntaxTree.addChild("pOpen");
    //concreteSyntaxTree.backToParent();
    expressionHolder = "";
    parseExpression();
    checkToken("pClose");
    
    abstractSyntaxTree.backToParent();
}

function parseIDAssign() {
    abstractSyntaxTree.addChild("Assign");
    
    checkToken("char");
    abstractSyntaxTree.addChild(tokens[tokenIndex-2].value);
    abstractSyntaxTree.backToParent();
    checkToken("equal");
    expressionHolder = "";
    parseExpression();
    abstractSyntaxTree.addChild(expressionHolder);
    abstractSyntaxTree.backToParent();
    abstractSyntaxTree.backToParent();
}

function parseStatementList() {
    if (currentToken.type === "bClose") {
        //End of the statement block
    }
    else if(tokenIndex !== locationTracker){
        locationTracker = tokenIndex;
        parseStatement();
        //concreteSyntaxTree.addChild("StatementList");
        parseStatementList();
        //concreteSyntaxTree.backToParent();//?
    }
    else {
        //Parse found an unparsable statement
    }
}

function parseExpression() {
    //concreteSyntaxTree.addChild("Expression");
    if (currentToken.type === "digit") {
        //concreteSyntaxTree.addChild("IntExpression");
        parseIntExpression();
    }
    else if (currentToken.type === "quote") {
        //concreteSyntaxTree.addChild("StringExpression");
        parseStringExpression();
    }
    else if (currentToken.type === "char") {
        //concreteSyntaxTree.addChild("Character");
        checkToken("char");
        abstractSyntaxTree.addChild(tokens[tokenIndex-2].value);
        abstractSyntaxTree.backToParent();
    }
    //concreteSyntaxTree.backToParent();
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
    abstractSyntaxTree.addChild("Declaration");
    
    checkToken("type");
    var type = tokens[tokenIndex-2].value;
    checkToken("char");
    //symbolTables[scope].pushSymbol(type, tokens[tokenIndex-2].value);
    abstractSyntaxTree.addChild(type);
    abstractSyntaxTree.backToParent();
    abstractSyntaxTree.addChild(tokens[tokenIndex-2].value);
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
        case "pOpen": putMessage("Expecting print expression");
            if (currentToken.value === "print(") {
                putMessage("Got a print expression!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not a print expression.  Error at position " + tokenIndex + ".");
            }
            break;
        case "pClose": putMessage("Expecting close of print expression");
            if (currentToken.value === ")") {
                putMessage("Got a close of print expression!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not a close of print expression.  Error at position " + tokenIndex + ".");
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