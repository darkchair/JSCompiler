/* lexer.js  */

var lexCounter = 0;

function LexError(message) {
    this.name = "LexError";
    this.message = message || "Default Message";
}

LexError.prototype = new Error();
LexError.prototype.constructor = LexError;

function lex()
{
    putMessage("\n-------------------");
    putMessage("Lexing ...");
    var tokenArray = new Array();
    var inQuotes = false;

    // Grab the "raw" source code.
    var sourceCode = document.getElementById("taSourceCode").value;
    // Trim the leading and trailing spaces.
    sourceCode = trim(sourceCode);
    // TODO: remove all spaces in the middle; remove line breaks too.
    sourceCode = sourceCode.replace(/\n/g, "");
    //sourceCode = sourceCode.replace(/\s/g, "");

    for(; lexCounter<sourceCode.length;) 
    {
        if(inQuotes)
        {
            if(isChar(sourceCode.charAt(lexCounter)))
            {
                tokenArray.push(new Token("char", sourceCode.charAt(lexCounter)));
                lexCounter++;
                continue;
            }
            if(sourceCode.charAt(lexCounter) === " ")
            {
                tokenArray.push(new Token("space", sourceCode.charAt(lexCounter)));
                lexCounter++;
                continue;
            }
            //If its a quote it falls through the if's
        }
        if(isDigit(sourceCode.charAt(lexCounter)))
        {
            if(isDigit(sourceCode.charAt(lexCounter+1)))
            {//If the next character is a digit
                errorCount++;
                putMessage("Numbers can only be one digit long at position " + lexCounter);
                lexCounter = sourceCode.length;
                throw new LexError("Numbers can only be one digit long at position " + lexCounter);
            }
            tokenArray.push(evaluateDigit(sourceCode));
            continue;
        }
        if(isChar(sourceCode.charAt(lexCounter)))
        {
            var holdString = evaluateChar(sourceCode);
            //evaluateChar() will add trailing spaces, so ignore them
            //when analyzing the string by using substring()
            var returnedToken;
            if(holdString.substring(0,5) === "print")
            {
                returnedToken = new Token("PrintStatement", "print");
                tokenArray.push(returnedToken);
                continue;
            }
            else if(holdString.substring(0,5) === "while") {
                returnedToken = new Token("WhileStatement", "while");
                tokenArray.push(returnedToken);
                continue;
            }
            else if(holdString.substring(0,2) === "if") {
                returnedToken = new Token("IfStatement", "if");
                tokenArray.push(returnedToken);
                continue;
            }
            else if(holdString.substring(0,3) === "int")
            {
                returnedToken = new Token("type", holdString.substring(0,3));
                tokenArray.push(returnedToken);
                continue;
            }
            else if(holdString.substring(0,6) === "string")
            {
                returnedToken = new Token("type", holdString.substring(0,6));
                tokenArray.push(returnedToken);
                continue;
            }
            else if(holdString.substring(0,4) === "true")
            {
                returnedToken = new Token("boolVal", holdString.substring(0,4));
                tokenArray.push(returnedToken);
                continue;
            }
            else if(holdString.substring(0,5) === "false")
            {
                returnedToken = new Token("boolVal", holdString.substring(0,5));
                tokenArray.push(returnedToken);
                continue;
            }
            else
            {
                for(var j=0; j<holdString.length; j++)
                {
                    if(holdString.charAt(j).charCodeAt(0) >= 65 &&
                        holdString.charAt(j).charCodeAt(0) <= 90)
                    {//No upper case allowed
                        errorCount++;
                        var count = lexCounter-1;
                        putMessage("Characters must be lower-case at position " + count);
                        throw new LexError("Characters must be lower-case at position " + count);
                    }
                    else if(holdString.charAt(j) !== " ")
                    {
                        tokenArray.push(new Token("char", holdString.charAt(j)));
                    }
                }
                continue;
            }
        }
        if(isOp(sourceCode.charAt(lexCounter)))
        {
            tokenArray.push(new Token("op", sourceCode.charAt(lexCounter)));
            lexCounter++;
            continue;
        }
        if(sourceCode.charAt(lexCounter) === "=")
        {
            tokenArray.push(new Token("equal", sourceCode.charAt(lexCounter)));
            lexCounter++;
            continue;
        }
        if(sourceCode.charAt(lexCounter) === "(")
        {
            tokenArray.push(new Token("pOpen", sourceCode.charAt(lexCounter)));
            lexCounter++;
            continue;
        }
        if(sourceCode.charAt(lexCounter) === ")")
        {
            tokenArray.push(new Token("pClose", sourceCode.charAt(lexCounter)));
            lexCounter++;
            continue;
        }
        if(sourceCode.charAt(lexCounter) === "{")
        {
            tokenArray.push(new Token("bOpen", sourceCode.charAt(lexCounter)));
            lexCounter++;
            continue;
        }
        if(sourceCode.charAt(lexCounter) === "\"")
        {
            tokenArray.push(new Token("quote", sourceCode.charAt(lexCounter)));
            lexCounter++;
            if(inQuotes)
                inQuotes = false;
            else
                inQuotes = true;
            continue;
        }
        if(sourceCode.charAt(lexCounter) === "}")
        {
            tokenArray.push(new Token("bClose", sourceCode.charAt(lexCounter)));
            lexCounter++;
            continue;
        }
        if(sourceCode.charAt(lexCounter) === EOF)
        {
            tokenArray.push(new Token("end", sourceCode.charAt(lexCounter)));
            lexCounter++;
            if(lexCounter < sourceCode.length)
            {
                //Warning, stuff after $
            }
            continue;
        }
        if(sourceCode.charAt(lexCounter) === " ")
        {
            lexCounter++;
            continue;
        }

    }

    return tokenArray;
}

function Token(type, value)
{
    this.type = type;
    this.value = value;
}

function evaluateDigit(code)
{
    var stringReturned = code.charAt(lexCounter);
    lexCounter++;
    return new Token("digit", stringReturned);
}

function evaluateChar(code)
{
    var stringReturned = code.charAt(lexCounter);
    lexCounter++;
    var spaceFlag = false;

    while( (isChar(code.charAt(lexCounter)) && !spaceFlag ) ||
            code.charAt(lexCounter) === " ")
    {
        if(code.charAt(lexCounter) === " ")
            spaceFlag = true;
        
        stringReturned += code.charAt(lexCounter);
        lexCounter++;
    }

    return stringReturned;
}

function isDigit(ch)
{
    if(ch.charCodeAt(0) >= 48 && ch.charCodeAt(0) <= 57)
    {
        return true; 
    }
    else
    {
        return false;
    }
}

function isChar(ch)
{
    if((ch.charCodeAt(0) >= 65 && ch.charCodeAt(0) <= 90)||
        (ch.charCodeAt(0) >= 97 && ch.charCodeAt(0) <= 122))
    {
        return true;
    }
    else
    {
        return false;
    }
}

function isID(ch)
{
    if(ch.length > 1) {
        return false;
    }
    else if((ch.charCodeAt(0) >= 97 && ch.charCodeAt(0) <= 122))
    {
        return true;
    }
    else
    {
        return false;
    }
}

function isOp(ch)
{
    if(ch === "+" || ch === "-")
    {
        return true;
    }
    else
    {
        return false;
    }
}