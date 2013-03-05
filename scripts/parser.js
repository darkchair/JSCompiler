/* parser.js */

function parse() {
    putMessage("Parsing ...");
    // Grab the next token.
    currentToken = consumeNextToken();
    // A valid parse derives the 'program' production, so begin there.
    parseProgram();
    // Report the results.
    putMessage("\nParsing found " + errorCount + " error(s).\n" +
               "Parsing found " + warningCount + " warning(s).");
    printSymbolTable();
}

function parseProgram() {
    parseStatement();
    checkToken("end");
    if (tokenIndex < tokens.length && errorCount == 0) {
        warningCount++;
        putMessage("Warning: Tokens found after EndOfFile");
    }
}

function parseStatement() {
    if (currentToken.type == "pOpen") {
        parsePrint();
    }
    else if (currentToken.type == "char" &&
        peekNextToken().type == "equal") {
        parseIDAssign();
    }
    else if (currentToken.type == "type") {
        parseVarDecleration();
    }
    else if (currentToken.type == "bOpen") {
        if(tokens[tokenIndex-1].type == "bOpen")
            symbolTable.push(new Symbol("bOpen", "{"));
        checkToken("bOpen");
        parseStatementList();
        if(tokens[tokenIndex-1].type == "bClose")
            symbolTable.push(new Symbol("bClose", "}"));
        checkToken("bClose");
    }
    else {
        errorCount++;
        var index = tokenIndex - 1;
        putMessage("ERROR: No valid statement found at position " + index + ".");
    }
}

function parsePrint() {
    checkToken("pOpen");
    parseExpression();
    checkToken("pClose");
}

function parseIDAssign() {
    checkToken("char");
    checkToken("equal");
    parseExpression();
}

function parseStatementList() {
    if (currentToken.type == "bClose") {
        //End of the statement list
    }
    else if(tokenIndex != locationTracker){
        locationTracker = tokenIndex;
        parseStatement();
        parseStatementList();
    }
    else {
        //Parse found an unparsable statement
    }
}

function parseExpression() {
    if (currentToken.type == "digit") {
        parseIntExpression();
    }
    if (currentToken.type == "quote") {
        parseCharExpression();
    }
    if (currentToken.type == "char") {
        checkToken("char");
    }
}

function parseIntExpression() {
    checkToken("digit");
    if (currentToken.type == "op") {
        checkToken("op");
        parseExpression();
    }
}

function parseCharExpression() {
    checkToken("quote");
    parseCharList();
    checkToken("quote");
}

function parseCharList() {
    if(currentToken.type == "char")
    {
        checkToken("char");
        if (currentToken.type == "char") {
            parseCharList();
        }
    }
    else
    {
        //Exit the loop
    }
}

function parseVarDecleration() {
    checkToken("type");
    var type = tokens[tokenIndex-2].value;
    checkToken("char");
    symbolTable.push(new Symbol(type, tokens[tokenIndex-2].value));
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
        if(symbolTable[i] == idValue)
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

function printSymbolTable() {
    for (var i = 0; i < symbolTable.length; i++) {
        document.getElementById("symbolTable").value += "[" + symbolTable[i].type + " , " + symbolTable[i].id + "]\n";
    }
}



function checkToken(expectedKind) {
    // Validate that we have the expected token kind and et the next token.
    switch (expectedKind) {
        case "type": putMessage("expecting a type");
            if (currentToken.value == "int" || currentToken.value == "char") {
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
            if (currentToken.value == "+" || currentToken.value == "-") {
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
        case "equal": putMessage("Expecting equal sign");
            if (currentToken.value == "=") {
                putMessage("Got an equal sign!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not an equal sign.  Error at position " + tokenIndex + ".");
            }
            break;
        case "end": putMessage("Expecting EOF");
            if (currentToken.value == EOF) {
                putMessage("Got an EOF!");
            }
            else {
                if(tokenIndex == tokens.length-1)
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
            if (currentToken.value == "P(") {
                putMessage("Got a print expression!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not a print expression.  Error at position " + tokenIndex + ".");
            }
            break;
        case "pClose": putMessage("Expecting close of print expression");
            if (currentToken.value == ")") {
                putMessage("Got a close of print expression!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not a close of print expression.  Error at position " + tokenIndex + ".");
            }
            break;
        case "bOpen": putMessage("Expecting open bracket");
            if (currentToken.value == "{") {
                putMessage("Got an open bracket!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not an open bracket.  Error at position " + tokenIndex + ".");
            }
            break;
        case "bClose": putMessage("Expecting close bracket");
            if (currentToken.value == "}") {
                putMessage("Got a close bracket!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not a close bracket.  Error at position " + tokenIndex + ".");
            }
            break;
        case "quote": putMessage("Expecting quote");
            if (currentToken.value == "\"") {
                putMessage("Got a quote!");
            }
            else {
                errorCount++;
                putMessage("ERROR: Not a quote.  Error at position " + tokenIndex + ".");
            }
            break;
        default: putMessage("ERROR: Invalid Token Type at position " + tokenIndex + ".");
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