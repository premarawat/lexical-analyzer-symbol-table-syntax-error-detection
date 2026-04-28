#include <stdio.h>
#include <string.h>

FILE *ftoken;

int iskeyword(char word[])
{
    char k[][20] = {"int","float","double","long","while","for","auto","struct",
    "break","else","switch","case","enum","register","typedef","char","extern",
    "return","union","const","short","unsigned","continue","signed","void",
    "default","goto","sizeof","do","if","static","volatile"};

    for (int i = 0; i < 32; i++)
    {
        if (strcmp(word, k[i]) == 0)
            return 1;
    }
    return 0;
}

int isidentifier(char word[])
{
    if (!((word[0] >= 'a' && word[0] <= 'z') ||
          (word[0] >= 'A' && word[0] <= 'Z') ||
          (word[0] == '_')))
        return 0;

    for (int i = 1; word[i] != '\0'; i++)
    {
        if (!((word[i] >= 'a' && word[i] <= 'z') ||
              (word[i] >= 'A' && word[i] <= 'Z') ||
              (word[i] == '_') ||
              (word[i] >= '0' && word[i] <= '9')))
            return 0;
    }
    return 1;
}

int isstring(char word[])
{
    if (word[0] != '"')
        return 0;

    int i = 1;
    while (word[i] != '\0')
    {
        if (word[i] == '"' && word[i + 1] == '\0')
            return 1;
        i++;
    }
    return 0;
}

int main()
{
    FILE *fp;
    int ch;
    char word[100];
    int line = 1;

    fp = fopen("inputsample.c", "r");
    ftoken = fopen("token.txt", "w");

    if (fp == NULL || ftoken == NULL)
    {
        printf("file not found\n");
        return 1;
    }

    int i;

    while ((ch = fgetc(fp)) != EOF)
    {
        if (ch == '\n')
        {
            line++;
            continue;
        }

        if (ch == ' ' || ch == '\t')
            continue;

        else if (ch == '#')
        {
            while ((ch = fgetc(fp)) != EOF && ch != '\n');
            line++;
        }

        else if (ch == '/')
        {
            int n = fgetc(fp);

            if (n == '/')
            {
                while ((ch = fgetc(fp)) != EOF && ch != '\n');
                line++;
            }
            else if (n == '*')
            {
                int prev = 0;
                while ((ch = fgetc(fp)) != EOF)
                {
                    if (ch == '\n') line++;
                    if (prev == '*' && ch == '/') break;
                    prev = ch;
                }
            }
            else
            {
                if (n != EOF)
                    ungetc(n, fp);

                fprintf(ftoken, "OPERATOR / %d\n", line);
                printf("OPERATOR / %d\n", line);
            }
        }

        else if ((ch >= 'a' && ch <= 'z') ||
                 (ch >= 'A' && ch <= 'Z') ||
                 ch == '_')
        {
            i = 0;
            word[i++] = ch;

            while ((ch = fgetc(fp)) != EOF &&
                  ((ch >= 'a' && ch <= 'z') ||
                   (ch >= 'A' && ch <= 'Z') ||
                   (ch >= '0' && ch <= '9') ||
                   ch == '_'))
            {
                word[i++] = ch;
            }

            word[i] = '\0';

            if (ch != EOF)
                ungetc(ch, fp);

            if (iskeyword(word)) {
                fprintf(ftoken, "KEYWORD %s %d\n", word, line);
                printf("KEYWORD %s %d\n", word, line);
            }
            else if (isidentifier(word)) {
                fprintf(ftoken, "IDENTIFIER %s %d\n", word, line);
                printf("IDENTIFIER %s %d\n", word, line);
            }
            else {
                fprintf(ftoken, "UNKNOWN %s %d\n", word, line);
                printf("UNKNOWN %s %d\n", word, line);
            }
        }

        else if (ch == '"')
        {
            int a = 0;
            word[a++] = ch;

            while ((ch = fgetc(fp)) != EOF)
            {
                word[a++] = ch;
                if (ch == '"') break;
            }

            word[a] = '\0';

            if (isstring(word)) {
                fprintf(ftoken, "STRING %s %d\n", word, line);
                printf("STRING %s %d\n", word, line);
            }
            else {
                fprintf(ftoken, "UNKNOWN %s %d\n", word, line);
                printf("UNKNOWN %s %d\n", word, line);
            }
        }

        else if (ch >= '0' && ch <= '9')
        {
            int b = 0;
            word[b++] = ch;

            while ((ch = fgetc(fp)) != EOF &&
                  ((ch >= '0' && ch <= '9') || ch == '.'))
            {
                word[b++] = ch;
            }

            word[b] = '\0';

            if (ch != EOF)
                ungetc(ch, fp);

            fprintf(ftoken, "CONSTANT %s %d\n", word, line);
            printf("CONSTANT %s %d\n", word, line);
        }

        else if (ch == '-' || ch == '=' || ch == '+' || ch == '*' ||
                 ch == '%' || ch == '!' || ch == '?' ||
                 ch == '>' || ch == '<')
        {
            int next = fgetc(fp);

            if ((ch == '=' && next == '=') ||
                (ch == '!' && next == '=') ||
                (ch == '>' && next == '=') ||
                (ch == '<' && next == '='))
            {
                fprintf(ftoken, "OPERATOR %c%c %d\n", ch, next, line);
                printf("OPERATOR %c%c %d\n", ch, next, line);
            }
            else
            {
                if (next != EOF)
                    ungetc(next, fp);

                fprintf(ftoken, "OPERATOR %c %d\n", ch, line);
                printf("OPERATOR %c %d\n", ch, line);
            }
        }

        else if (ch == '(' || ch == ')' || ch == '[' || ch == ']' ||
                 ch == '{' || ch == '}' || ch == ',' || ch == ';' || ch == ':')
        {
            fprintf(ftoken, "SEPARATOR %c %d\n", ch, line);
            printf("SEPARATOR %c %d\n", ch, line);
        }

        else
        {
            fprintf(ftoken, "UNKNOWN %c %d\n", ch, line);
            printf("UNKNOWN %c %d\n", ch, line);
        }
    }

    fclose(fp);
    fclose(ftoken);

    return 0;
}