import React, { useState, useCallback } from 'react';
import { AppStep } from './types';
import Header from './components/Header';
import StepIndicator from './components/StepIndicator';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import Spinner from './components/Spinner';
import Button from './components/Button';
import SubscriptionModal from './components/SubscriptionModal';
import { generateVirtualTryOn } from './services/geminiService';
import { useUser } from './hooks/useUser';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.MODEL_UPLOAD);
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  const { uploadCount, isPremium, incrementUploadCount, subscribeUser, canUpload } = useUser();

  const handleGoToClothingUpload = () => {
    if (modelImage) {
        setCurrentStep(AppStep.CLOTHING_UPLOAD);
    }
  };

  const handleClothingImageUpload = (base64: string) => {
    setClothingImage(base64);
  };

  const handleGenerate = useCallback(async () => {
    if (!modelImage || !clothingImage) {
      setError('لطفاً تمام تصاویر مورد نیاز را آپلود کنید.');
      return;
    }

    if (!canUpload) {
        setShowSubscriptionModal(true);
        return;
    }

    setCurrentStep(AppStep.GENERATING);
    setError(null);
    setResultImage(null);

    try {
      const generatedImage = await generateVirtualTryOn(modelImage, clothingImage);
      setResultImage(generatedImage);
      setCurrentStep(AppStep.RESULT);
      incrementUploadCount();
    } catch (err) {
      console.error(err);
      setError('خطایی در هنگام ایجاد تصویر رخ داد. لطفاً دوباره تلاش کنید.');
      setCurrentStep(AppStep.CLOTHING_UPLOAD);
    }
  }, [modelImage, clothingImage, canUpload, incrementUploadCount]);

  const handleReset = () => {
    setCurrentStep(AppStep.MODEL_UPLOAD);
    setModelImage(null);
    setClothingImage(null);
    setResultImage(null);
    setError(null);
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800 flex flex-col items-center p-4">
      <Header />
      <main className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-10 mt-8">
        <StepIndicator currentStep={currentStep} />
        
        {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 rounded-md" role="alert">
                <p className="font-bold">خطا</p>
                <p>{error}</p>
            </div>
        )}

        {!isPremium && (
            <div className="text-center mb-6 p-3 bg-indigo-100 text-indigo-800 rounded-lg">
                شما <strong>{3 - uploadCount}</strong> آپلود رایگان دیگر دارید.
            </div>
        )}

        {currentStep === AppStep.MODEL_UPLOAD && (
          <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-center mb-2">مرحله ۱: عکس خود را آپلود کنید</h2>
              <p className="text-center text-gray-500 mb-6">یک عکس واضح از روبرو که تمام بدن شما مشخص باشد آپلود کنید.</p>
              <div className="max-w-md mx-auto">
                  <ImageUploader 
                      onImageUpload={setModelImage} 
                      title="آپلود عکس مدل" 
                      description="یک عکس واضح از روبرو." 
                      id="model-uploader" 
                  />
              </div>
              <div className="mt-8 text-center">
                  <Button onClick={handleGoToClothingUpload} disabled={!modelImage}>
                      رفتن به مرحله بعد
                  </Button>
              </div>
          </div>
        )}
        
        {currentStep === AppStep.CLOTHING_UPLOAD && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="text-center p-4 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">عکس مدل</h3>
                    {modelImage && <img src={modelImage} alt="Model preview" className="rounded-lg max-h-96 mx-auto" />}
                </div>
                <ImageUploader 
                    onImageUpload={handleClothingImageUpload} 
                    title="مرحله ۲: عکس لباس را آپلود کنید"
                    description="عکسی با پس‌زمینه ساده از لباس مورد نظر را انتخاب کنید."
                    id="clothing-uploader"
                />
            </div>
             <div className="mt-8 text-center">
                <Button onClick={handleGenerate} disabled={!clothingImage}>
                  ایجاد پرو مجازی
                </Button>
             </div>
          </div>
        )}

        {currentStep === AppStep.GENERATING && (
          <div className="flex flex-col items-center justify-center h-64 animate-fade-in">
            <Spinner />
            <p className="text-lg font-semibold text-gray-600 mt-4">در حال ایجاد ظاهر جدید شما...</p>
            <p className="text-sm text-gray-500">این فرآیند ممکن است چند لحظه طول بکشد.</p>
          </div>
        )}

        {currentStep === AppStep.RESULT && resultImage && (
          <ResultDisplay 
            resultImage={resultImage}
            onReset={handleReset}
          />
        )}
      </main>

      {showSubscriptionModal && (
        <SubscriptionModal 
            onClose={() => setShowSubscriptionModal(false)}
            onSubscribe={() => {
                subscribeUser();
                setShowSubscriptionModal(false);
            }}
        />
      )}

      <footer className="text-center text-gray-500 mt-8 text-sm">
        <p>پشتیبانی: 09120137032</p>
      </footer>
    </div>
  );
};

export default App;