from flask import Flask, render_template, request, jsonify
import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Initialize Groq client
client = Groq()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/explain', methods=['POST'])
def explain():
    data = request.json
    code = data.get('code')
    theme = data.get('theme', 'General Everyday Life')
    
    if not code:
        return jsonify({'error': 'No code provided'}), 400

    prompt = f"""
I have a piece of code. Please analyze it carefully before responding.

**IF THE CODE HAS ERRORS, BUGS, OR INVALID SYNTAX:**
- DO NOT use any real-life analogies or stories.
- Directly state the exact error message that would occur (e.g., SyntaxError, TypeError).
- Provide a direct, technical explanation of what went wrong and how to fix it.

**IF THE CODE IS CORRECT:**
Please explain the code using this structure:
1. **The Big Picture ({theme} Analogy)**: Give a brief, relatable real-life analogy based strictly on the theme of "{theme}" to explain what the entire code is trying to achieve.
2. **Step-by-Step Breakdown**: Walk through the code step-by-step. Briefly explain what the code does technically, and IMMEDIATELY tie it back to your "{theme}" analogy.
3. **Execution Output**: Show the EXACT output this code will produce when run.

Code:
```
{code}
```
"""

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a code analyzer and tutor. For broken code, you act strictly as a compiler/debugger giving direct technical error fixes without analogies. For working code, you mix technical explanations with relatable real-life analogies and predict the exact output. Use Markdown formatting.",
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
        )
        
        explanation = chat_completion.choices[0].message.content
        return jsonify({'explanation': explanation})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
