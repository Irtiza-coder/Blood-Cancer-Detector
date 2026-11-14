from django.shortcuts import render,redirect
import os
import numpy as np
import tensorflow as tf
from PIL import Image
from django.http import JsonResponse
from django.conf import settings
from tensorflow.keras.applications.efficientnet import preprocess_input

IMG_SIZE = (300, 300) 
CLASS_NAMES = ['Benign', 'Early', 'Pre', 'Pro']

# Memory-efficient model loader
_interpreter = None
_keras_model = None

def get_model():
    global _interpreter, _keras_model
    tflite_path = os.path.join(settings.BASE_DIR, 'detector', 'model', 'best_leukemia_model.tflite')
    keras_path = os.path.join(settings.BASE_DIR, 'detector', 'model', 'best_leukemia_model.keras')

    if os.path.exists(tflite_path):
        if _interpreter is None:
            _interpreter = tf.lite.Interpreter(model_path=tflite_path)
            _interpreter.allocate_tensors()
        return ('tflite', _interpreter)
    elif os.path.exists(keras_path):
        if _keras_model is None:
            _keras_model = tf.keras.models.load_model(keras_path)
        return ('keras', _keras_model)
    else:
        raise FileNotFoundError("No model file found in detector/model/")

def run_prediction(img_array):
    model_type, model_obj = get_model()
    if model_type == 'tflite':
        input_details = model_obj.get_input_details()
        output_details = model_obj.get_output_details()
        model_obj.set_tensor(input_details[0]['index'], img_array.astype(np.float32))
        model_obj.invoke()
        return model_obj.get_tensor(output_details[0]['index'])
    else:
        return model_obj.predict(img_array)

def predict_image(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST request required'}, status=400)

    if 'image' not in request.FILES:
        return JsonResponse({'error': 'No image uploaded'}, status=400)

    try:
        image = request.FILES['image']
        img = Image.open(image).convert('RGB')
        img = img.resize(IMG_SIZE)
        
        img_array = np.array(img, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)
        
        img_array = preprocess_input(img_array)
        
        prediction = run_prediction(img_array)
        
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

