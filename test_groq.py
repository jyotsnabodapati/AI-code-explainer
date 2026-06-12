import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()

# Initialize the Groq client (it automatically looks for GROQ_API_KEY)
client = Groq()

# Send a test prompt
chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Explain Python loops in simple language.",
        }
    ],
    model="llama-3.3-70b-versatile", # Groq model name
)

print(chat_completion.choices[0].message.content)

