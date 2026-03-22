# Lexical Analyzer with Symbol Table and Syntax Error Detection

### Mini Compiler Front-End (C Language)

## 📌 Project Description

This project implements the **front-end phases of a compiler** for a subset of the C programming language. The system performs lexical analysis, syntax analysis, error detection, and symbol table generation. The program reads a C source file, tokenizes it, checks the syntax using a recursive descent parser, and builds a symbol table for identifiers.

This project is developed as part of **Problem Based Learning (PBL)** to understand the working of compiler design concepts.

---

## 🎯 Objectives

* To design and implement a **Lexical Analyzer** to generate tokens.
* To implement a **Syntax Analyzer (Parser)** to check grammar rules.
* To implement **Syntax Error Detection** with line numbers.
* To build a **Symbol Table** for identifiers.
* To understand the **front-end phases of a compiler**.

---

## ⚙️ Features

* Reads input C program from file.
* Removes comments and preprocessor directives.
* Identifies tokens:

  * Keywords
  * Identifiers
  * Constants
  * Operators
  * Separators
  * Strings
* Generates token file (`token.txt`).
* Performs syntax analysis using recursive descent parsing.
* Detects syntax errors with proper line numbers.
* Creates and displays symbol table.
* Stores identifier name, type, value, and line number.

---

## 🧠 Compiler Phases Implemented

| Phase            | Description                             |
| ---------------- | --------------------------------------- |
| Lexical Analysis | Converts source code into tokens        |
| Syntax Analysis  | Checks syntax using grammar rules       |
| Symbol Table     | Stores identifier information           |
| Error Handling   | Detects syntax errors with line numbers |

---

## 📂 Project Structure

```text
Lexical-Analyzer-Project/
│
├── lexer.c            → Lexical Analyzer
├── parser.c           → Syntax Analyzer + Symbol Table
├── inputsample.c      → Input C Program
├── token.txt          → Generated Tokens
├── README.md          → Project Documentation
```

---

## ▶️ How to Run the Project

### Step 1: Compile Lexical Analyzer

```bash
gcc lexer.c -o lexer
```

### Step 2: Run Lexical Analyzer

```bash
./lexer
```

This will generate:

```
token.txt
```

### Step 3: Compile Parser

```bash
gcc parser.c -o parser
```

### Step 4: Run Parser

```bash
./parser
```

---

## 📝 Sample Input Program

```c
#include<stdio.h>
int main() {
    int a = 10;
    float b = 20.5;
    int sum;
    sum = a + b;
    if(sum > 20) {
        printf("Greater value");
    }
    else {
        printf("Smaller value");
    }
    return 0;
}
```

---

## 🔎 Sample Symbol Table Output

```
SYMBOL TABLE
Name    Type    Value   Line
a       int     10      4
b       float   20.5    5
sum     int     a+b     6
```

---

## 📖 Grammar Used

```
program → function
function → int main() { statements }

statements → statement statements | ε

statement → declaration
statement → assignment
statement → if_statement
statement → else_block
statement → function_call
statement → return_statement

declaration → datatype identifier ;
declaration → datatype identifier = constant ;

assignment → identifier = expression ;

expression → identifier
expression → constant
expression → identifier operator identifier

if_statement → if ( condition ) { statements }

condition → identifier operator identifier
condition → identifier operator constant

function_call → identifier ( string ) ;

return_statement → return constant ;
```

---

## 📚 Concepts Used

* Lexical Analysis
* Tokenization
* Recursive Descent Parsing
* Context-Free Grammar (CFG)
* Symbol Table Management
* Syntax Error Handling
* File Handling in C

---

## 🎓 Learning Outcomes

* Understanding of compiler design phases.
* Implementation of lexical analyzer and parser.
* Understanding of symbol table usage.
* Error detection in source code.
* Working with file handling in C.

---

## 📌 Conclusion

This project demonstrates the working of a **mini compiler front-end** by implementing lexical analysis, syntax analysis, and symbol table management. It helps in understanding how compilers analyze source code and detect syntax errors before code execution.

---

## 👩‍💻 Author

**Project:** Lexical Analyzer with Symbol Table and Syntax Error Detection
**Language:** C
**Type:** Compiler Design Mini Project 

---
