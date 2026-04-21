# 🔍 Lexical Analyzer with Symbol Table & Syntax Error Detection

A **Compiler Design Project** that implements a **Lexical Analyzer**, **Symbol Table**, and **Syntax Error Detection System** using C and integrates with a simple web-based interface.

---

## 📌 Project Overview

This project simulates the **front-end phases of a compiler**, focusing on:

* Token generation (Lexical Analysis)
* Symbol Table creation
* Syntax error detection with line tracking

A lexical analyzer is the **first phase of a compiler**, responsible for converting source code into meaningful tokens ([GeeksforGeeks][1]).

---

## ⚙️ Features

✅ **Lexical Analysis**

* Breaks source code into tokens
* Identifies:

  * Keywords
  * Identifiers
  * Operators
  * Constants
  * Symbols

✅ **Symbol Table Generation**

* Stores identifiers and their attributes
* Helps in semantic analysis

✅ **Syntax Error Detection**

* Detects invalid syntax
* Displays correct **line numbers for errors**

✅ **Token Output**

* Generates token list in structured format

✅ **Web Interface (Node.js + HTML)**

* Upload input file
* View tokens and errors visually

---

## 🛠️ Technologies Used

* **C Language** → Core compiler logic
* **Lex / DFA Concepts** → Token recognition
* **Node.js (Express)** → Backend server
* **HTML, CSS, JavaScript** → Frontend UI

---

## 📂 Project Structure

```
sample/
│── public/
│   ├── index.html
│   ├── styles.css
│
│── app.js
│── server.js
│
│── lex.c              # Lexical analyzer
│── parser.c           # Syntax analyzer
│── dfa.c              # DFA for identifier validation
│── inputsample.c      # Sample input program
│── token.txt          # Generated tokens
│
│── package.json
│── README.md
```

---

## 🚀 How to Run

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/premarawat/lexical-analyzer-symbol-table-syntax-error-detection.git
cd lexical-analyzer-symbol-table-syntax-error-detection
```

---

### 2️⃣ Compile C Programs

```bash
gcc lex.c -o lex
gcc parser.c -o parser
gcc dfa.c -o dfa
```

---

### 3️⃣ Run Backend Server

```bash
npm install
node server.js
```

---

### 4️⃣ Open in Browser

```
http://localhost:3000
```

---

## 📊 Example

### Input

```c
int a = 10;
float b = 20.5;
```

### Output Tokens

```
int → Keyword
a → Identifier
= → Operator
10 → Constant
```

---

## 🧠 Working

1. Input source code is read
2. Lexical analyzer scans character by character
3. Tokens are generated
4. Symbol table is updated
5. Syntax errors are detected and displayed

The lexical analyzer groups characters into tokens and removes unnecessary elements like whitespace and comments ([BrainKart][2]).

---

## 📸 Output Screenshots
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/40977e65-2b5f-457f-a58f-045d32a60e45" />



---

## 🔮 Future Improvements

* Add semantic analysis phase
* Improve UI/UX of dashboard
* Support more programming constructs
* Export results as PDF
* Real-time code editor integration

---

## 👩‍💻 Author

**Prema Rawat**

---

## 📄 License

This project is for educational purposes.
