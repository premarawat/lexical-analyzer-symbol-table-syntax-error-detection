#include <stdio.h>
#include <string.h>
#include <stdlib.h>
struct symbol {
    char name[50];
    char type[20];
    char value[50];
    int line;
};
struct symbol symtab[100];
int symcount = 0;

char token[1000][20];
char tokenvalue[1000][50];
int lineno[1000];
int tokencnt = 0;
int pos = 0;
void declaration();
void expression();
void assignment();
void condition();
void function_call();
void return_stmt();
void if_statement();
void function_def();
void statement();
void insert();
void print_symbol_table();
void parser();
void readtoken()
{
    FILE *fp = fopen("token.txt", "r");
    if (fp == NULL)
    {
        printf("token.txt not found\n");
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
void match(char expect[])
{
    if (strcmp(token[pos], expect) == 0)
    {
        printf("TOKEN: %s (%s)\n", token[pos], tokenvalue[pos]);
        pos++;
    }
    else
    {
        printf("Syntax Error at line %d: Expected %s but found %s (%s)\n",
               lineno[pos], expect, token[pos], tokenvalue[pos]);
        exit(1);
    }
}
void declaration(){
    char type[20], name[50], value[50] = "-";

    strcpy(type, tokenvalue[pos]);  
    match("KEYWORD");

    strcpy(name, tokenvalue[pos]);  
    match("IDENTIFIER");

    if(strcmp(token[pos],"OPERATOR")==0){
        match("OPERATOR");

        strcpy(value, tokenvalue[pos]); 
        match("CONSTANT");
    }
    insert(name, type, value, lineno[pos]);
    match("SEPARATOR");
}
void expression()
{
    if (strcmp(token[pos], "IDENTIFIER") == 0)
    {
        match("IDENTIFIER");
    }
    else
    {
        match("CONSTANT");
    }
    if (strcmp(token[pos], "OPERATOR") == 0)
    {
        match("OPERATOR");
        if (strcmp(token[pos], "IDENTIFIER") == 0)
        {
            match("IDENTIFIER");
        }
        else
        {
            match("CONSTANT");
        }
    }
}
void assignment(){
    char name[50], value[50] = "", temp[50];

    strcpy(name, tokenvalue[pos]);
    match("IDENTIFIER");
    match("OPERATOR");  
    strcpy(value, tokenvalue[pos]);
    match(token[pos]);  
    if(strcmp(token[pos], "OPERATOR") == 0){
        strcat(value, tokenvalue[pos]);  
        match("OPERATOR");

        strcat(value, tokenvalue[pos]);  
        match(token[pos]);  
    }
    int line = lineno[pos];
    match("SEPARATOR");
    insert(name, "", value, line);
}
void condition()
{
    match("IDENTIFIER");
    match("OPERATOR");
    if (strcmp(token[pos], "IDENTIFIER") == 0)
    {
        match("IDENTIFIER");
    }
    else
    {
        match("CONSTANT");
    }
}
void function_call()
{
    match("IDENTIFIER"); 
    match("SEPARATOR");  
    match("STRING");    
    match("SEPARATOR");  
    match("SEPARATOR");  
}
void return_stmt()
{
    match("KEYWORD");   
    match("CONSTANT");  
    match("SEPARATOR"); 
}
void if_statement(){
    match("KEYWORD");      
    match("SEPARATOR");    
    condition();
    match("SEPARATOR");    
    match("SEPARATOR");    
    while(!(strcmp(token[pos],"SEPARATOR")==0 &&
            strcmp(tokenvalue[pos],"}")==0)){
        statement();
    }
    match("SEPARATOR");    
}
void function_def(){
    match("KEYWORD");      
    match("IDENTIFIER");  
    match("SEPARATOR");    
    match("SEPARATOR");   
    match("SEPARATOR");    
    while(!(strcmp(token[pos],"SEPARATOR")==0 &&
            strcmp(tokenvalue[pos],"}")==0)){
        statement();
    }
    match("SEPARATOR");    
}
void statement(){
    if(strcmp(token[pos],"KEYWORD")==0 &&
       (strcmp(tokenvalue[pos],"int")==0 ||
        strcmp(tokenvalue[pos],"float")==0 ||
        strcmp(tokenvalue[pos],"char")==0)){
        declaration();
    }
    else if(strcmp(token[pos],"KEYWORD")==0 &&
            strcmp(tokenvalue[pos],"if")==0){
        if_statement();
    }
    else if(strcmp(token[pos],"KEYWORD")==0 &&
            strcmp(tokenvalue[pos],"else")==0){
        match("KEYWORD");      
        match("SEPARATOR");    
        while(!(strcmp(token[pos],"SEPARATOR")==0 &&
                strcmp(tokenvalue[pos],"}")==0)){
            statement();
        }
        match("SEPARATOR");    
    }
    else if(strcmp(token[pos],"KEYWORD")==0 &&
            strcmp(tokenvalue[pos],"return")==0){
        return_stmt();
    }
    else if(strcmp(token[pos],"IDENTIFIER")==0 &&
            strcmp(token[pos+1],"SEPARATOR")==0 &&
            strcmp(tokenvalue[pos+1],"(")==0){
        function_call();
    }
    else if(strcmp(token[pos],"IDENTIFIER")==0){
        assignment();
    }
    else{
        printf("Invalid statement at line %d\n", lineno[pos]);
        exit(1);
    }
}
void insert(char name[], char type[], char value[], int line){
    for(int i=0;i<symcount;i++){
        if(strcmp(symtab[i].name,name)==0){
            strcpy(symtab[i].value,value);
            return;
        }
    }
    strcpy(symtab[symcount].name,name);
    strcpy(symtab[symcount].type,type);
    strcpy(symtab[symcount].value,value);
    symtab[symcount].line=line;
    symcount++;
}
void print_symbol_table(){
    printf("\n\nSYMBOL TABLE\n");
    printf("Name\tType\tValue\tLine\n");

    for(int i=0;i<symcount;i++){
        printf("%s\t%s\t%s\t%d\n",
            symtab[i].name,
            symtab[i].type,
            symtab[i].value,
            symtab[i].line);
    }
}
void parser(){
    function_def();
    printf("Syntax is valid\n");
    print_symbol_table();
}
int main()
{
    readtoken();
    printf("\n\nstarting syntax analysis...\n");
    parser();
    return 0;
}