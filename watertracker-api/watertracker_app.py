# watertracker_app.py
from flask import Flask, request, jsonify
import base64
from io import BytesIO
from PIL import Image
import pytesseract  # Using Tesseract for OCR

app = Flask(__name__)

@app.route('/meterReading', methods=['POST'])
def meter_reading():
    """
    Expects JSON: { "image": "<base64-encoded image data>" }
    Returns JSON: { "reading": <float> }
    """
    data = request.get_json()
    if 'image' not in data:
        return jsonify({"error": "No image field in request"}), 400
    
    try:
        image_data = base64.b64decode(data['image'])
        image = Image.open(BytesIO(image_data))
        
        # OCR using Tesseract
        ocr_result = pytesseract.image_to_string(image)
        
        # Attempt to parse the numeric reading
        # e.g., if ocr_result = "12345\n", extract digits
        reading_value_str = "".join(ch for ch in ocr_result if ch.isdigit())
        if not reading_value_str:
            return jsonify({"error": "Could not parse reading"}), 400
        
        reading_value = float(reading_value_str)
        
        return jsonify({"reading": reading_value})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Additional endpoints for auth, billing, address, etc. can be added here.

if __name__ == '__main__':
    app.run(debug=True)
