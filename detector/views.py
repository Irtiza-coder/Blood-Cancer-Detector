from django.shortcuts import render,redirect
import os
import numpy as np
import tensorflow as tf
from PIL import Image
from django.http import JsonResponse
from django.conf import settings
from tensorflow.keras.applications.efficientnet import preprocess_input

# Load model ONCE
MODEL_PATH = os.path.join(settings.BASE_DIR, 'detector', 'model', 'best_leukemia_model.keras')
model = tf.keras.models.load_model(MODEL_PATH)

IMG_SIZE = (300, 300) 
CLASS_NAMES = ['Benign', 'Early', 'Pre', 'Pro']

def predict_image(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST request required'}, status=400)

    if 'image' not in request.FILES:
        return JsonResponse({'error': 'No image uploaded'}, status=400)

    try:
        image = request.FILES['image']
        img = Image.open(image).convert('RGB')
        img = img.resize(IMG_SIZE)
        
        img_array = np.array(img)
        img_array = np.expand_dims(img_array, axis=0)
        
        img_array = preprocess_input(img_array)
        
        prediction = model.predict(img_array)
        
        confidence = float(np.max(prediction))
        result = CLASS_NAMES[np.argmax(prediction)]
        return JsonResponse({
            'result': result,
            'confidence': f"{confidence*100:.2f}%"
        })
    except Exception as e:
        print(f"Error processing image: {e}")
        return JsonResponse({'error': f"Failed to process image: {str(e)}"}, status=500)
    
    
def index(request):
    return render(request, 'detector/index.html')

def check(request):
    return render(request, 'detector/check.html')

def info(request):
    return render(request, 'detector/info.html')

