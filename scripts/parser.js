/* parser.js */

function parse() {
    putMessage("Parsing [" + tokens + "]");
    // Grab the next token.
    currentToken = consumeNextToken();
    // A valid parse derives the 'program' production, so begin there.
    parseProgram();
    // Report the results.
    putMessage("Parsing found " + errorCount + " error(s).");
}

function parseProgram() {
    parseStatement();
    checkToken("end");
}

function parseStatement() {
    var next = peekNextToken();
    if (next.type == "pOpen") {
        parsePrint();
    }
    else if (next.type == "id") {
        parseIDAssign();
    }
    else if (next.type == "type") {
        parseVarDecleration();
    }
    else if (next.type == "bOpen") {
        parseStatementList();
        checkToken("bClose");
    }
}

function parsePrint() {
    checkToken("pOpen");
    parseExpression();
    checkToken("pClose");
}

function parseIDAssign() {
    checkToken("id");
    checkToken("equal");
    parseExpression();
}

function parseStatementList() {
    if (peekNextToken().type == "bClose") {
        //End of the statement list
    }
    else {
        parseStatement();
        parseStatementList();
    }
}

function parseExpression() {
    var next = peekNextToken();
    if (next.type == "digit") {
        parseIntExpression();
    }
    if (next.type == "qOpen") {
        parseCharExpression();
    }
    if (next.type == "id") {
        checkToken("id");
    }
}

function parseIntExpression() {
    checkToken("digit");
    if (peekNextToken().type == "op") {
        checkToken("op");
        parseExpression();
    }
}

function parseCharExpression() {
    checkToken("qOpen");
    parseCharList();
    checkToken("qClose");
}

function parseCharList() {
    checkToken("char");
    if (peekNextToken().type == "char") {
        parseCharList();
    }
}

function parseVarDeclaration() {
    checkToken("type");
    checkToken("id");
}

//-----------------------------------------------------------------------

function peekNextToken() {
    var thisToken = EOF;    // Let's assume that we're at the EOF.
    if (tokenIndex < tokens.length) {
        // If we're not at EOF, then return the next token in the stream.
        thisToken = tokens[tokenIndex];
        putMessage("Next token:" + thisToken);
    }
    return thisToken;
} 

function consumeNextToken() {
    var thisToken = EOF;    // Let's assume that we're at the EOF.
    if (tokenIndex < tokens.length) {
        // If we're not at EOF, then return the next token in the stream and advance the index.
        thisToken = tokens[tokenIndex];
        putMessage("Current token:" + thisToken);
        tokenIndex++;
    }
    return thisToken;
}



function checkToken(expectedKind) {
    // Validate that we have the expected token kind and et the next token.
    switch (expectedKind) {
        case "digit": putMessage("Expecting a digit");
            if (currentToken.value.charValueAt(0) <= 48 && currentToken.value.charValueAt(0) >= 57) {
                putMessage("Got a digit!");
            }
            else {
                errorCount++;
                putMessage("NOT a digit.  Error at position " + tokenIndex + ".");
            }
            break;
        case "op": putMessage("Expecting an operator");
            if (currentToken.value == "+" || currentToken.value == "-") {
                putMessage("Got an operator!");
            }
            else {
                errorCount++;
                putMessage("NOT an operator.  Error at position " + tokenIndex + ".");
            }
            break;
        case "id": putMessage("Expecting id");
            if (currentToken.value.charValueAt(0) <= 65 && currentToken.value.charValueAt(0) >= 90) {//If its a lower-case letter
                putMessage("Got an id!");
            }
            else {
                errorCount++;
                putMessage("NOT an id.  Error at position " + tokenIndex + ".");
            }
            break;
        case "char": putMessage("Expecting character");
            if (currentToken.value.charValueAt(0) <= 65 && currentToken.value.charValueAt(0) >= 90) {//If its a lower-case letter
                putMessage("Got a character!");
            }
            else {
                errorCount++;
                putMessage("NOT a character.  Error at position " + tokenIndex + ".");
            }
            break;
        case "equal": putMessage("Expecting equal sign");
            if (currentToken.value == "P(") {
                putMessage("Got an equal sign!");
            }
            else {
                errorCount++;
                putMessage("NOT an equal sign.  Error at position " + tokenIndex + ".");
            }
            break;
        case "end": putMessage("Expecting EOF");
            if (currentToken.value == EOF) {
                putMessage("Got an EOF!");
            }
            else {
                //warning, EOF not found
            }
            break;
        case "pOpen": putMessage("Expecting print expression");
            if (currentToken.value == "P(") {
                putMessage("Got a print expression!");
            }
            else {
                errorCount++;
                putMessage("NOT a print expression.  Error at position " + tokenIndex + ".");
            }
            break;
        case "pClose": putMessage("Expecting close of print expression");
            if (currentToken.value == "P(") {
                putMessage("Got a close of print expression!");
            }
            else {
                errorCount++;
                putMessage("NOT a close of print expression.  Error at position " + tokenIndex + ".");
            }
            break;
        case "bOpen": putMessage("Expecting open bracket");
            if (currentToken.value == "P(") {
                putMessage("Got an open bracket!");
            }
            else {
                errorCount++;
                putMessage("NOT an open bracket.  Error at position " + tokenIndex + ".");
            }
            break;
        case "bClose": putMessage("Expecting close bracket");
            if (currentToken.value == "P(") {
                putMessage("Got a close bracket!");
            }
            else {
                errorCount++;
                putMessage("NOT a close bracket.  Error at position " + tokenIndex + ".");
            }
            break;
        default: putMessage("Parse Error: Invalid Token Type at position " + tokenIndex + ".");
            break;
    }
    // Consume another token, having just checked this one, because that 
    // will allow the code to see what's coming next... a sort of "look-ahead".
    currentToken = consumeNextToken();
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