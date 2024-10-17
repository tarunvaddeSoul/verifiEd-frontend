import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "./ui/button";
import { ArrowRightIcon, DownloadIcon } from "@radix-ui/react-icons";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl mb-6">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-600">
            SSI Training Portal
          </span>
        </h1>
        <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
          Learn Self-Sovereign Identity (SSI) in a hands-on environment. Enroll in courses, receive and verify credentials, and earn Verifiable Credentials (VCs) as completion certificates.
        </p>
        
        <Card className="w-full max-w-2xl mb-10">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-600">Prerequisites</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-4">Before proceeding, please install the BC Wallet app:</p>
            <div className="flex justify-center space-x-4">
              <a href="https://apps.apple.com/ca/app/bc-wallet/id1587380443" target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  App Store
                </Button>
              </a>
              <a href="https://play.google.com/store/apps/details?id=ca.bc.gov.BCWallet" target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Play Store
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link to="/portal">
            <Button size="lg" className="w-full sm:w-auto">
              Enter Training Portal
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/onboarding">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Student Onboarding
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}