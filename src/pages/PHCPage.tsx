import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "../components/ui/use-toast";
import { QRCodeSVG as QRCode } from "qrcode.react";

const steps = [
  { title: "Connect", description: "Connect with SSI Portal" },
  { title: "Verify", description: "Verify existing PHC" },
  { title: "Authenticate", description: "Authenticate yourself" },
  { title: "Issue", description: "Issue new PHC" },
  { title: "Complete", description: "PHC process completed" },
];

export default function PHCPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [invitationUrl, setInvitationUrl] = useState("");
  const [connectionId, setConnectionId] = useState("");
  const [theirLabel, setTheirLabel] = useState("");
  const [name, setName] = useState("");
  const [verificationMethod, setVerificationMethod] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [bankVerificationSuccess, setBankVerificationSuccess] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authResult = urlParams.get("authResult");
    const error = urlParams.get("error");

    if (authResult) {
      handleAuthResult(authResult);
    } else if (error) {
      setErrorMessage(decodeURIComponent(error));
      setCurrentStep(2);
    }
  }, []);

  const handleAuthResult = (authResult: string) => {
    try {
      const result = JSON.parse(decodeURIComponent(authResult));
      if (result.success) {
        setName(result.user.name || result.user.login);
        setVerificationMethod("GITHUB");
        setCurrentStep(3);
        window.history.replaceState({}, document.title, "/phc");
      } else {
        setErrorMessage(result.error || "Failed to authenticate with GitHub");
        setCurrentStep(2);
      }
    } catch (error) {
      console.error("Error parsing auth result:", error);
      setErrorMessage("An error occurred during authentication");
      setCurrentStep(2);
    }
  };

  const createInvitation = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.BASE_URL}/agent/create-invitation`
      );
      setInvitationUrl(response.data.data.invitationUrl);
      checkConnectionState(response.data.data.outOfBandId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionState = async (outOfBandId: string) => {
    let attempts = 0;
    const maxAttempts = 30;
    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(
          `${process.env.BASE_URL}/agent/connection-state/id/${outOfBandId}`
        );
        if (response.data.data.state === "completed") {
          const connectionId = response.data.data.connectionId;
          setConnectionId(connectionId);
          localStorage.setItem("connectionId", connectionId);
          setTheirLabel(response.data.data.theirLabel);
          localStorage.setItem("theirLabel", response.data.data.theirLabel);
          setCurrentStep(1);
          return;
        }
      } catch (error) {
        console.error("Error checking connection state:", error);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }
    toast({
      title: "Connection Failed",
      description: "Failed to establish connection. Please try again.",
      variant: "destructive",
    });
  };

  const verifyExistingPHC = async () => {
    try {
      const response = await axios.post(
        `${process.env.BASE_URL}/phc/check-and-issue/theirLabel/${theirLabel}`
      );
      if (response.data.data.shouldIssueNewPHC) {
        setCurrentStep(2);
      } else {
        toast({
          title: "PHC Verified",
          description: "Valid PHC already exists in your wallet.",
          variant: "default",
        });
        setCurrentStep(4);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify existing PHC. Please try again.",
        variant: "destructive",
      });
    }
  };

  const authenticateUser = (method: string) => {
    if (method === "GITHUB") {
      window.location.href = `${process.env.BASE_URL}/auth/github/login`;
    } else if (method === "BANK") {
      setVerificationMethod("BANK");
    }
  };

  const verifyBankDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.BASE_URL}/verification/bank-verification/ifsc/${ifscCode}/accountNumber/${accountNumber}`
      );
      if (response.data.data.accountExists) {
        setName(response.data.data.nameAtBank);
        setBankVerificationSuccess(true);
        setVerificationMethod("BANK");
        setCurrentStep(3);
      } else {
        setErrorMessage(
          "Bank account verification failed. Please check your details and try again."
        );
      }
    } catch (error) {
      setErrorMessage(
        "An error occurred during bank verification. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const issuePHC = async () => {
    try {
      const currentTimeInSeconds = Math.floor(Date.now() / 1000);
      const expiryTimeInSeconds = (
        currentTimeInSeconds +
        60 * 60 * 60
      ).toString();
      const encodedName = encodeURIComponent(name);
      const response = await axios.post(
        `${process.env.BASE_URL}/issuance/issue-phc/name/${encodedName}/expiry/${expiryTimeInSeconds}/verificationMethod/${verificationMethod}/connectionId/${connectionId}`
      );
      checkIssuanceState(response.data.data.credentialRecord.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to issue PHC. Please try again.",
        variant: "destructive",
      });
    }
  };

  const checkIssuanceState = async (credentialRecordId: string) => {
    let attempts = 0;
    const maxAttempts = 30;
    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(
          `${process.env.BASE_URL}/issuance/credential-state/id/${credentialRecordId}`
        );
        if (response.data.data.state === "done") {
          await storePHCData();
          setCurrentStep(4);
          return;
        } else if (response.data.data.state === "abandoned") {
          toast({
            title: "Issuance Failed",
            description:
              response.data.data.errorMessage || "PHC issuance was abandoned.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error("Error checking issuance state:", error);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }
    toast({
      title: "Issuance Timeout",
      description: "PHC issuance process timed out. Please try again.",
      variant: "destructive",
    });
  };

  const storePHCData = async () => {
    try {
      const theirLabel = localStorage.getItem("theirLabel");
      const expiry = Math.floor(Date.now() / 1000 + 60 * 60 * 60).toString();
      await axios.post(`${process.env.BASE_URL}/phc`, { theirLabel, expiry });
    } catch (error) {
      console.error("Failed to store PHC data:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">
            Personhood Credential (PHC)
          </CardTitle>
          <CardDescription>
            A unique digital credential that verifies your identity as a real
            person without revealing personal information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.title} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    index < currentStep
                      ? "bg-green-500 text-white"
                      : index === currentStep
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {index < currentStep ? <CheckCircle2 size={16} /> : index + 1}
                </div>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            {currentStep === 0 && (
              <div className="space-y-4">
                <p>Connect your wallet to start the PHC process.</p>
                <Button onClick={createInvitation} disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Connect Wallet"
                  )}
                </Button>
                {invitationUrl && (
                  <div className="mt-4">
                    <p className="mb-2">
                      Scan this QR code with your digital wallet:
                    </p>
                    <QRCode
                      value={invitationUrl}
                      size={200}
                      className="mx-auto"
                    />
                  </div>
                )}
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <p>Verifying your existing PHC...</p>
                <Button onClick={verifyExistingPHC}>Verify PHC</Button>
              </div>
            )}

            {currentStep === 2 && (
              <Tabs defaultValue="github" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="github">GitHub</TabsTrigger>
                  <TabsTrigger value="bank">Bank Verification</TabsTrigger>
                </TabsList>
                <TabsContent value="github">
                  <Card>
                    <CardHeader>
                      <CardTitle>GitHub Authentication</CardTitle>
                      <CardDescription>
                        Authenticate using your GitHub account.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        onClick={() => authenticateUser("GITHUB")}
                        className="w-full"
                      >
                        Authenticate with GitHub
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="bank">
                  <Card>
                    <CardHeader>
                      <CardTitle>Bank Verification</CardTitle>
                      <CardDescription>
                        Verify your identity using your Indian bank account
                        details.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="space-y-1">
                        <Label htmlFor="ifsc">IFSC Code</Label>
                        <Input
                          id="ifsc"
                          value={ifscCode}
                          onChange={(e) => setIfscCode(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="account">Account Number</Label>
                        <Input
                          id="account"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={verifyBankDetails}
                        disabled={loading || !ifscCode || !accountNumber}
                        className="w-full"
                      >
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          "Verify Bank Details"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <p>Authentication successful. Ready to issue your PHC.</p>
                <Button onClick={issuePHC} disabled={!name}>
                  Issue New PHC
                </Button>
              </div>
            )}

            {currentStep === 4 && (
              <Alert>
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  Your PHC has been issued and added to your wallet.
                </AlertDescription>
              </Alert>
            )}

            {errorMessage && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
