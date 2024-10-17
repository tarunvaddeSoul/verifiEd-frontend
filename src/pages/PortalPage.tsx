import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Loader2 } from "lucide-react";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { toast } from "../components/ui/use-toast";
import { modules } from "../lib/modules";

export default function PortalPage() {
  const [hasPHC, setHasPHC] = useState(false);
  const [connectionId, setConnectionId] = useState("");
  const [outOfBandId, setOutOfBandId] = useState("");
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [currentModule, setCurrentModule] = useState(1);
  const [loading, setLoading] = useState(false);
  const [invitationUrl, setInvitationUrl] = useState("");
  const [verificationInProgress, setVerificationInProgress] = useState(false);
  const [issuingCredential, setIssuingCredential] = useState(false);
  const [userName, setUserName] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const [selectedModule, setSelectedModule] = useState<number | null>(null);

  useEffect(() => {
    const storedConnectionId = localStorage.getItem("connectionId");
    if (storedConnectionId) {
      setConnectionId(storedConnectionId);
    }
  }, []);


  const createInvitation = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.BASE_URL}/agent/create-invitation`
      );
      setInvitationUrl(response.data.data.invitationUrl);
      setOutOfBandId(response.data.data.outOfBandId);
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
          setConnectionId(response.data.data.connectionId);
          localStorage.setItem("connectionId", response.data.data.connectionId);
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

  const verifyPHC = async () => {
    setVerificationInProgress(true);
    try {
      const response = await axios.post(
        `${process.env.BASE_URL}/verification/verify-phc/connectionId/${connectionId}`
      );
      const proofId = response.data.data.proofRecord.id;
      await checkPHCVerificationState(proofId);
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Failed to verify Personhood Credential. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerificationInProgress(false);
    }
  };


  const checkPHCVerificationState = async (proofId: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(
          `${process.env.BASE_URL}/verification/verification-state/id/${proofId}`
        );

        const verificationState = response.data.data.state;
        if (verificationState === "done") {
          const verified = response.data.data.verified;
          setHasPHC(verified);
          return;
        } else if (verificationState === "abandoned") {
          toast({
            title: "Verification Error",
            description:
              "Failed to verify Personhood Credential. Please try again.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error("Error checking verification state:", error);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }

    toast({
      title: "Verification Timeout",
      description: "Verification process timed out. Please try again.",
      variant: "destructive",
    });
  };


  const verifyModule = async (moduleId: number) => {
    if (moduleId <= 1) {
      return true; // Module 1 doesn't need verification
    }

    setVerificationInProgress(true);
    try {
      const moduleName = modules[moduleId - 1].title;
      const response = await axios.post(
        `${process.env.BASE_URL}/verification/verify/${encodeURIComponent(moduleName)}`,
        { connectionId }
      );
      const proofId = response.data.data.proofRecord.id;
      const verified = await checkModuleVerificationState(proofId);
      if (verified) {
        toast({
          title: "Verification Successful",
          description: `Module ${moduleId} completion verified.`,
        });
        return true;
      } else {
        toast({
          title: "Verification Failed",
          description: `Failed to verify completion of module ${
            moduleId - 1
          }. Please try again.`,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error verifying module:", error);
      toast({
        title: "Verification Error",
        description:
          "An error occurred while verifying the module. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setVerificationInProgress(false);
    }
  };

  const openModule = async (moduleId: number) => {
    if (!hasPHC) {
      toast({
        title: "Access Denied",
        description: "Please verify your student access card first.",
        variant: "destructive",
      });
      return;
    }

    if (moduleId > 1) {
      setVerificationInProgress(true);
      setSelectedModule(moduleId);
      const canOpenModule = await verifyModule(moduleId - 1);
      if (!canOpenModule) {
        setSelectedModule(null);
        setVerificationInProgress(false);
        return;
      }
    }

    setCurrentModule(moduleId);
    setSelectedModule(moduleId);
    setVerificationInProgress(false);
  };

  const checkModuleVerificationState = async (proofId: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(
          `${process.env.BASE_URL}/verification/verification-state/id/${proofId}`
        );

        const verificationState = response.data.data.state;
        if (verificationState === "done") {
          return response.data.data.verified;
        } else if (verificationState === "abandoned") {
          return false;
        }
      } catch (error) {
        console.error("Error checking verification state:", error);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }

    return false; // Timeout reached
  };

  const completeModule = async (moduleId: number, moduleName: string) => {
    setCurrentStep(0);
    setUserName("");
    setError("");
    setIssuingCredential(true);
  };

  const issueCredential = async (moduleId: number, moduleName: string) => {
    if (!userName) {
      setError("Please enter your name.");
      return;
    }

    setCurrentStep(1);
    setError("");

    try {
      const response = await axios.post(
        `${process.env.BASE_URL}/issuance/issue/${moduleName}`,
        {
          name: userName,
          marks: (Math.floor(Math.random() * 21) + 80).toString(),
          connectionId: connectionId,
        }
      );

      const credentialId = response.data.data.credentialRecord.id;
      await checkCredentialState(credentialId);
    } catch (error) {
      setError("Failed to issue credential. Please try again.");
      setCurrentStep(0);
    }
  };

  const checkCredentialState = async (id: string) => {
    let state = "offer-sent";
    while (state !== "done" && state !== "abandoned") {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const response = await axios.get(
          `${process.env.BASE_URL}/issuance/credential-state/id/${id}`
        );
        state = response.data.data.state;
        if (state === "done") {
          setCurrentStep(2);
          setCompletedModules([...completedModules, currentModule]);
          break;
        } else if (state === "abandoned") {
          setError("Failed to issue credential. Please try again.");
          setCurrentStep(0);
          break;
        }
      } catch (err) {
        setError("Failed to check credential state. Please try again.");
        setCurrentStep(0);
        break;
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Training Portal</h1>
      {!connectionId && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="text-center">
            <p className="mb-4">
              To access the training modules, please connect your digital
              wallet.
            </p>
            <Button onClick={createInvitation} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Connect Wallet"
              )}
            </Button>
          </div>

            {invitationUrl && (
              <div className="mt-4">
                <p className="mb-2">
                  Scan this QR code with your digital wallet:
                </p>
                <QRCode value={invitationUrl} size={200} className="mx-auto" />
              </div>
            )}
          </CardContent>
        </Card>
      )}
{connectionId && !hasPHC && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Verify Personhood Credential</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Please verify your Personhood Credential to access the training
              modules.
            </p>
            <Button
              onClick={verifyPHC}
              disabled={verificationInProgress}
            >
              {verificationInProgress ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Verify PHC"
              )}
            </Button>
          </CardContent>
        </Card>
      )}
      {hasPHC && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => (
            <Card
              key={module.id}
              className={
                completedModules.includes(module.id) ? "border-green-500" : ""
              }
            >
              <CardHeader>
                <CardTitle>{module.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => openModule(module.id)}>
                  {completedModules.includes(module.id)
                    ? "Review Module"
                    : "Start Module"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog
        open={selectedModule !== null}
        onOpenChange={() => setSelectedModule(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedModule && modules[selectedModule - 1].title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {verificationInProgress ? (
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                <p className="mt-2">Verifying previous module completion...</p>
              </div>
            ) : (
              <>
                <p className="mb-4">
                  {selectedModule && modules[selectedModule - 1].content}
                </p>
                <h3 className="font-semibold mb-2">Key Points:</h3>
                <ul className="list-disc pl-5 mb-4">
                  {selectedModule &&
                    modules[selectedModule - 1].keyPoints.map(
                      (point, index) => <li key={index}>{point}</li>
                    )}
                </ul>
                {selectedModule && completedModules.includes(selectedModule) ? (
                  <p className="text-green-600 font-semibold mt-4">
                    Module completed!
                  </p>
                ) : (
                  <Button
                    onClick={() =>
                      selectedModule &&
                      completeModule(
                        selectedModule,
                        modules[selectedModule - 1].title
                      )
                    }
                    className="mt-4"
                  >
                    Mark as Completed
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={issuingCredential} onOpenChange={setIssuingCredential}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Module and Receive VC</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {currentStep === 0 && (
              <>
                <Label htmlFor="name" className="mb-2 block">
                  Enter your name:
                </Label>
                <Input
                  id="name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="mb-4"
                />
                <Button
                  onClick={() =>
                    issueCredential(
                      currentModule,
                      modules[currentModule - 1].title
                    )
                  }
                >
                  Receive {modules[currentModule - 1].title} VC
                </Button>
              </>
            )}
            {currentStep === 1 && (
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                <p className="mt-2">Issuing credential...</p>
              </div>
            )}
            {currentStep === 2 && (
              <div className="text-center">
                <p className="text-green-600 font-semibold">
                  Credential issued successfully!
                </p>
                <Button
                  onClick={() => setIssuingCredential(false)}
                  className="mt-4"
                >
                  Close
                </Button>
              </div>
            )}
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
