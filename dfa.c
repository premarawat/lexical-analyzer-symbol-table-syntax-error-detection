<<<<<<< HEAD
#include <stdio.h>
#include <ctype.h>
int isValidIdentifier(char str[])
{
    int i = 0;
    if(!(isalpha(str[0]) || str[0] == '_'))
        return 0;
    for(i = 1; str[i] != '\0'; i++)
    {
        if(!(isalnum(str[i]) || str[i] == '_'))
            return 0;
    }

    return 1; 
}

int main()
{
    char str[100];

    printf("Enter identifier: ");
    scanf("%s", str);

    if(isValidIdentifier(str))
        printf("Valid Identifier\n");
    else
        printf("Invalid Identifier\n");

    return 0;
=======
#include <stdio.h>
#include <ctype.h>
int isValidIdentifier(char str[])
{
    int i = 0;
    if(!(isalpha(str[0]) || str[0] == '_'))
        return 0;
    for(i = 1; str[i] != '\0'; i++)
    {
        if(!(isalnum(str[i]) || str[i] == '_'))
            return 0;
    }

    return 1; 
}

int main()
{
    char str[100];

    printf("Enter identifier: ");
    scanf("%s", str);

    if(isValidIdentifier(str))
        printf("Valid Identifier\n");
    else
        printf("Invalid Identifier\n");

    return 0;
>>>>>>> 3f630db358d52ccb8f30c9e5dcb690db0360076d
}