#include <stdio.h>
#include <string.h>
#include <stdlib.h>

char token[1000][20];
char tokenvalue[1000][50];
int lineno[1000];
int tokencnt = 0;
int pos = 0;

void readtoken()
{
    FILE *fp = fopen("token.txt", "r");
    if (fp == NULL)
    {
        printf("{\"name\": \"Error: token.txt not found\"}\n");
        exit(1);
    }
    while (fscanf(fp, "%s", token[tokencnt]) != EOF)
    {
        if (strcmp(token[tokencnt], "STRING") == 0)
        {
            fscanf(fp, " \"%[^\"]\" %d", tokenvalue[tokencnt], &lineno[tokencnt]);
        }
        else
        {
            fscanf(fp, "%s %d", tokenvalue[tokencnt], &lineno[tokencnt]);
        }
        tokencnt++;
    }
    fclose(fp);
}

struct Node
{
    char name[100];
    struct Node *children[50];
    int num_children;
};

struct Node *create_node(const char *name)
{
    struct Node *n = (struct Node *)malloc(sizeof(struct Node));
    strcpy(n->name, name);
    n->num_children = 0;
    return n;
}

void add_child(struct Node *parent, struct Node *child)
{
    if (parent->num_children < 50 && child != NULL)
    {
        parent->children[parent->num_children++] = child;
    }
}

void escape_json(char *dest, const char *src)
{
    int i = 0, j = 0;
    while (src[i] != '\0')
    {
        if (src[i] == '"' || src[i] == '\\')
        {
            dest[j++] = '\\';
        }
        dest[j++] = src[i];
        i++;
    }
    dest[j] = '\0';
}

// Skips a token without adding it to the tree (removes syntax noise)
void skip(char expect[])
{
    if (pos < tokencnt && strcmp(token[pos], expect) == 0)
    {
        pos++;
    }
}

// Matches a token and returns a leaf node with just its value
struct Node *match_val(char expect[])
{
    struct Node *n = create_node("");
    if (pos < tokencnt && strcmp(token[pos], expect) == 0)
    {
        char escaped[100];
        escape_json(escaped, tokenvalue[pos]);
        sprintf(n->name, "%s", escaped);
        pos++;
    }
    else
    {
        sprintf(n->name, "Error: expected %s", expect);
    }
    return n;
}

// Function declarations
struct Node *declaration();
struct Node *expression();
struct Node *assignment();
struct Node *condition();
struct Node *function_call();
struct Node *return_stmt();
struct Node *if_statement();
struct Node *function_def();
struct Node *statement();

struct Node *declaration()
{
    struct Node *node = create_node("Declaration");

    // Type
    struct Node *typeNode = create_node("Type");
    add_child(typeNode, match_val("KEYWORD"));
    add_child(node, typeNode);

    // Variable
    struct Node *varNode = create_node("Variable");
    add_child(varNode, match_val("IDENTIFIER"));
    add_child(node, varNode);

    if (pos < tokencnt && strcmp(token[pos], "OPERATOR") == 0)
    {
        skip("OPERATOR"); // skip '='
        struct Node *valNode = create_node("Value");
        add_child(valNode, match_val("CONSTANT"));
        add_child(node, valNode);
    }
    skip("SEPARATOR"); // skip ';'
    return node;
}

struct Node *expression()
{
    // Basic AST expression handling
    struct Node *left = NULL;
    if (pos < tokencnt && strcmp(token[pos], "IDENTIFIER") == 0)
        left = match_val("IDENTIFIER");
    else
        left = match_val("CONSTANT");

    if (pos < tokencnt && strcmp(token[pos], "OPERATOR") == 0)
    {
        char op_val[50];
        strcpy(op_val, tokenvalue[pos]);
        skip("OPERATOR");

        struct Node *right = NULL;
        if (pos < tokencnt && strcmp(token[pos], "IDENTIFIER") == 0)
            right = match_val("IDENTIFIER");
        else
            right = match_val("CONSTANT");

        struct Node *opNode = create_node(op_val); // Operator is the parent node in AST
        add_child(opNode, left);
        add_child(opNode, right);
        return opNode;
    }
    return left;
}

struct Node *assignment()
{
    struct Node *node = create_node("Assignment");

    struct Node *target = match_val("IDENTIFIER");
    add_child(node, target);

    skip("OPERATOR"); // skip '='

    struct Node *expr = expression();
    add_child(node, expr);

    skip("SEPARATOR"); // skip ';'
    return node;
}

struct Node *condition()
{
    struct Node *left = match_val("IDENTIFIER");

    char op_val[50] = "Error";
    if (pos < tokencnt && strcmp(token[pos], "OPERATOR") == 0)
    {
        strcpy(op_val, tokenvalue[pos]);
        skip("OPERATOR");
    }

    struct Node *right = NULL;
    if (pos < tokencnt && strcmp(token[pos], "IDENTIFIER") == 0)
        right = match_val("IDENTIFIER");
    else
        right = match_val("CONSTANT");

    struct Node *opNode = create_node(op_val);
    add_child(opNode, left);
    add_child(opNode, right);
    return opNode;
}

struct Node *function_call()
{
    struct Node *node = create_node("FunctionCall");

    struct Node *funcName = match_val("IDENTIFIER");
    add_child(node, funcName);

    skip("SEPARATOR"); // '('

    struct Node *arg = match_val("STRING");
    add_child(node, arg);

    skip("SEPARATOR"); // ')'
    skip("SEPARATOR"); // ';'
    return node;
}

struct Node *return_stmt()
{
    struct Node *node = create_node("Return");
    skip("KEYWORD"); // 'return'
    add_child(node, match_val("CONSTANT"));
    skip("SEPARATOR"); // ';'
    return node;
}

struct Node *if_statement()
{
    struct Node *node = create_node("If");

    skip("KEYWORD");   // 'if'
    skip("SEPARATOR"); // '('

    struct Node *condNode = create_node("Condition");
    add_child(condNode, condition());
    add_child(node, condNode);

    skip("SEPARATOR"); // ')'
    skip("SEPARATOR"); // '{'

    struct Node *trueBranch = create_node("TrueBranch");
    while (pos < tokencnt && !(strcmp(token[pos], "SEPARATOR") == 0 && strcmp(tokenvalue[pos], "}") == 0))
    {
        add_child(trueBranch, statement());
    }
    add_child(node, trueBranch);
    skip("SEPARATOR"); // '}'

    if (pos < tokencnt && strcmp(token[pos], "KEYWORD") == 0 && strcmp(tokenvalue[pos], "else") == 0)
    {
        skip("KEYWORD");   // 'else'
        skip("SEPARATOR"); // '{'

        struct Node *falseBranch = create_node("FalseBranch");
        while (pos < tokencnt && !(strcmp(token[pos], "SEPARATOR") == 0 && strcmp(tokenvalue[pos], "}") == 0))
        {
            add_child(falseBranch, statement());
        }
        add_child(node, falseBranch);
        skip("SEPARATOR"); // '}'
    }
    return node;
}

struct Node *function_def()
{
    struct Node *node = create_node("Function");

    struct Node *retType = match_val("KEYWORD");
    add_child(node, retType);

    struct Node *name = match_val("IDENTIFIER");
    add_child(node, name);

    skip("SEPARATOR"); // '('
    skip("SEPARATOR"); // ')'
    skip("SEPARATOR"); // '{'

    struct Node *body = create_node("Body");
    while (pos < tokencnt && !(strcmp(token[pos], "SEPARATOR") == 0 && strcmp(tokenvalue[pos], "}") == 0))
    {
        add_child(body, statement());
    }
    add_child(node, body);
    skip("SEPARATOR"); // '}'
    return node;
}

struct Node *statement()
{
    if (strcmp(token[pos], "KEYWORD") == 0 &&
        (strcmp(tokenvalue[pos], "int") == 0 ||
         strcmp(tokenvalue[pos], "float") == 0 ||
         strcmp(tokenvalue[pos], "char") == 0))
    {
        return declaration();
    }
    else if (strcmp(token[pos], "KEYWORD") == 0 && strcmp(tokenvalue[pos], "if") == 0)
    {
        return if_statement();
    }
    else if (strcmp(token[pos], "KEYWORD") == 0 && strcmp(tokenvalue[pos], "return") == 0)
    {
        return return_stmt();
    }
    else if (strcmp(token[pos], "IDENTIFIER") == 0 &&
             pos + 1 < tokencnt &&
             strcmp(token[pos + 1], "SEPARATOR") == 0 &&
             strcmp(tokenvalue[pos + 1], "(") == 0)
    {
        return function_call();
    }
    else if (strcmp(token[pos], "IDENTIFIER") == 0)
    {
        return assignment();
    }
    else
    {
        struct Node *err = create_node("ErrorNode");
        char escaped[100];
        escape_json(escaped, tokenvalue[pos]);
        struct Node *errToken = create_node(escaped);
        add_child(err, errToken);
        pos++;
        return err;
    }
}

void print_json(struct Node *node)
{
    if (node == NULL)
        return;
    printf("{\"name\": \"%s\"", node->name);
    if (node->num_children > 0)
    {
        printf(", \"children\": [");
        for (int i = 0; i < node->num_children; i++)
        {
            print_json(node->children[i]);
            if (i < node->num_children - 1)
                printf(", ");
        }
        printf("]");
    }
    printf("}");
}

int main() {
    readtoken();

    if(tokencnt > 0) {
        struct Node* root = create_node("Program");

        // global declarations
        while (pos < tokencnt &&
               strcmp(token[pos], "KEYWORD") == 0 &&
               (strcmp(tokenvalue[pos], "int") == 0 ||
                strcmp(tokenvalue[pos], "float") == 0 ||
                strcmp(tokenvalue[pos], "char") == 0)) {

            if (strcmp(token[pos + 1], "IDENTIFIER") == 0 &&
                strcmp(tokenvalue[pos + 1], "main") == 0)
                break;

            add_child(root, declaration());
        }

        // function
        add_child(root, function_def());

        print_json(root);   // ✅ ONLY ONCE
        printf("\n");
    }
    else {
        printf("{\"name\": \"Empty\"}\n");
    }

    return 0;
}
