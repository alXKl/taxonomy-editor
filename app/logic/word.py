class Word:

    def __init__(self, text, vector, frequency):
        self.text = text
        self.vector = vector
        self.frequency = frequency

    def __repr__(self):
        vector_preview = ', '.join(map(str, self.vector[:2]))
        return f"{self.text} [{vector_preview}, ...]"