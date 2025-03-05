'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function TestRedirectPage() {
  const [timeLeft, setTimeLeft] = useState(10); // 10 segundos para teste
  
  useEffect(() => {
    console.log("Inicializando contagem regressiva com", timeLeft, "segundos");
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        console.log("Atualizando contagem para:", prev - 1);
        if (prev <= 1) {
          clearInterval(interval);
          console.log("Contagem finalizada, redirecionando...");
          // Comentado para não redirecionar durante o teste
          // window.location.href = "https://example.com";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      console.log("Limpando intervalo");
      clearInterval(interval);
    };
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative bg-white text-gray-900">
      <div className="relative z-10 flex flex-col items-center justify-center w-full">
        <div className="w-full max-w-[500px] h-[200px] sm:h-[220px] md:h-[240px] relative mb-8">
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
            <h2 className="text-2xl font-bold">Logo de Teste</h2>
          </div>
        </div>

        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold">Inscrição Confirmada!</h1>
          <div className="text-xl sm:text-2xl opacity-90">
            Obrigado por se inscrever. Você receberá mais informações em breve.
          </div>
          
          {/* Barra de contagem regressiva */}
          <div className="mt-6 w-full max-w-md mx-auto">
            <p className="mb-2 text-base font-medium">
              Você será redirecionado em <span className="font-bold">{timeLeft}</span> segundos
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner overflow-hidden">
              <div 
                className="h-3 rounded-full transition-all duration-1000 ease-linear"
                style={{ 
                  width: `${(timeLeft / 10) * 100}%`,
                  background: `linear-gradient(90deg, rgba(37,99,235,1) 0%, rgba(59,130,246,1) 100%)`,
                }}
              ></div>
            </div>
          </div>
          
          {/* Botão do WhatsApp */}
          <div className="mt-8">
            <a 
              href="#" 
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-full transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              Participar do Grupo do WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 