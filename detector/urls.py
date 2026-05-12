from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('check/', views.check, name='check'),
    path('predict/', views.predict_image, name='predict'),
    path('info/', views.info, name='info')
]
