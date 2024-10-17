import React from 'react';
import { CheckIcon } from "@radix-ui/react-icons";

export interface Step {
  title: string;
  description: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={index} className={`flex items-center ${index <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border-2 ${index < currentStep ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
            {index < currentStep ? (
              <CheckIcon className="w-5 h-5 text-white" />
            ) : (
              <span className="text-sm font-medium">{index + 1}</span>
            )}
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium">{step.title}</p>
            <p className="text-sm text-gray-500">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}