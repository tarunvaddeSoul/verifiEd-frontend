import React, { useState } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Loader2, Award } from "lucide-react";
import { toast } from "../components/ui/use-toast";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

interface SkillBadge {
  courseName: string;
  timestamp: number;
}

const colorSchemes = [
    { bg: "from-blue-400 to-blue-600", text: "text-white", icon: "text-blue-100" },
    { bg: "from-green-400 to-green-600", text: "text-white", icon: "text-green-100" },
    { bg: "from-purple-400 to-purple-600", text: "text-white", icon: "text-purple-100" },
    { bg: "from-yellow-400 to-yellow-600", text: "text-white", icon: "text-yellow-100" },
    { bg: "from-pink-400 to-pink-600", text: "text-white", icon: "text-pink-100" },
  ];

export default function SkillsPage() {
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<SkillBadge[]>([]);

  const checkSkills = async () => {
    setLoading(true);
    try {
      const connectionId = localStorage.getItem("connectionId");
      if (!connectionId) {
        throw new Error(
          "No connection ID found. Please connect your wallet first."
        );
      }
      const verificationResponse = await axios.get(
        `${process.env.BASE_URL}/verification/skills/connectionId/${connectionId}`
      );
      const proofRecordId = verificationResponse.data.data.proofRecord.id;

      let state = "request-sent";
      while (state !== "done" && state !== "abandoned") {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const stateResponse = await axios.get(
          `${process.env.BASE_URL}/verification/verification-state/id/${proofRecordId}`
        );
        state = stateResponse.data.data.state;
        if (state === "abandoned") {
          throw new Error("Verification process was abandoned.");
        }
      }

      const dataResponse = await axios.get(
        `${process.env.BASE_URL}/verification/requested-data/id/${proofRecordId}`
      );
      const requestedProof =
        dataResponse.data.data.requestedProof.revealed_attr_groups;

      const skillBadges: SkillBadge[] = Object.values(requestedProof).map(
        (group: any) => ({
          courseName: group.values["Course Name"].raw,
          timestamp: parseInt(group.values["Timestamp"].raw, 10),
        })
      );

      setSkills(skillBadges);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to fetch skills. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Skills Dashboard</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Verified Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {skills.length === 0 ? (
            <div className="text-center">
              <p className="mb-4">
                Click the button below to verify and display your acquired skills.
              </p>
              <Button
                onClick={checkSkills}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors duration-300 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  "Check my skills!"
                )}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {skills.map((skill, index) => (
                <motion.div
                  key={skill.courseName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className={`overflow-hidden transform hover:scale-105 transition-transform duration-300 shadow-lg ${colorSchemes[index % colorSchemes.length].bg} bg-gradient-to-br`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center">
                        <Award className={`w-16 h-16 mb-4 ${colorSchemes[index % colorSchemes.length].icon}`} />
                        <h3 className={`text-l font-bold mb-2 ${colorSchemes[index % colorSchemes.length].text}`}>
                          {skill.courseName}
                        </h3>
                        <p className={`text-sm ${colorSchemes[index % colorSchemes.length].text} opacity-80`}>
                          Earned on: {formatDate(skill.timestamp)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
