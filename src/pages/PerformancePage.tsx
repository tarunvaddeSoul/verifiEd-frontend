import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "../components/ui/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { modules } from "../lib/modules";

interface ModuleMarks {
  module: string;
  marks: number;
  color: string;
}

const colorSchemes = [
  {
    bg: "from-blue-400 to-blue-600",
    text: "text-white",
    icon: "text-blue-100",
    barColor: "#3B82F6",
  },
  {
    bg: "from-green-400 to-green-600",
    text: "text-white",
    icon: "text-green-100",
    barColor: "#10B981",
  },
  {
    bg: "from-purple-400 to-purple-600",
    text: "text-white",
    icon: "text-purple-100",
    barColor: "#8B5CF6",
  },
  {
    bg: "from-yellow-400 to-yellow-600",
    text: "text-white",
    icon: "text-yellow-100",
    barColor: "#F59E0B",
  },
  {
    bg: "from-pink-400 to-pink-600",
    text: "text-white",
    icon: "text-pink-100",
    barColor: "#EC4899",
  },
];

export default function PerformancePage() {
  const [loading, setLoading] = useState(false);
  const [marks, setMarks] = useState<ModuleMarks[]>([]);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  useEffect(() => {
    const storedConnectionId = localStorage.getItem("connectionId");
    if (storedConnectionId) {
      setConnectionId(storedConnectionId);
    }
  }, []);

  const requestPerformanceData = async () => {
    if (!connectionId) {
      toast({
        title: "Error",
        description:
          "No connection ID found. Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.BASE_URL}/verification/check-performance/connectionId/${connectionId}`
      );
      const proofRecordId = response.data.data.proofRecord.id;
      await checkVerificationState(proofRecordId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request performance data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationState = async (id: string) => {
    let state = "request-sent";
    while (state !== "done" && state !== "abandoned") {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Poll every 2 seconds
      try {
        const response = await axios.get(
          `${process.env.BASE_URL}/verification/verification-state/id/${id}`
        );
        state = response.data.data.state;
        if (state === "done") {
          await fetchMarks(id);
          break;
        } else if (state === "abandoned") {
          toast({
            title: "Error",
            description: "Verification failed. Please try again.",
            variant: "destructive",
          });
          break;
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to check verification state. Please try again.",
          variant: "destructive",
        });
        break;
      }
    }
  };

  const fetchMarks = async (id: string) => {
    try {
      const response = await axios.get(
        `${process.env.BASE_URL}/verification/requested-data/id/${id}`
      );
      const requestedProof = response.data.data.requestedProof.revealed_attrs;

      const moduleMarks: ModuleMarks[] = Object.entries(requestedProof).map(
        ([key, value]: [string, any], index: number) => {
          const moduleNumber = parseInt(key.match(/\d+/)?.[0] || "0", 10);
          const moduleTitle =
            modules[moduleNumber - 1]?.title || `Module ${moduleNumber}`;
          const colorScheme = colorSchemes[index % colorSchemes.length];

          return {
            module: moduleTitle,
            marks: parseInt(value.raw, 10),
            color: colorScheme.barColor,
          };
        }
      );

      setMarks(moduleMarks);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch marks. Please try again.",
        variant: "destructive",
      });
    }
  };
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Performance Dashboard</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Module Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {marks.length === 0 ? (
            <div className="text-center">
              <p className="mb-4">
                Click the button below to fetch your performance data.
              </p>
              <Button onClick={requestPerformanceData} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Fetch Performance Data"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marks.map((mark, index) => {
                  const colorScheme = colorSchemes[index % colorSchemes.length];
                  return (
                    <Card
                      key={mark.module}
                      className={`bg-gradient-to-br ${colorScheme.bg}`}
                    >
                      <CardHeader>
                        <CardTitle className={colorScheme.text}>
                          {mark.module}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className={`text-2xl font-bold ${colorScheme.text}`}>
                          {mark.marks}%
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={marks}
                    margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                    barCategoryGap="30%" // Reduce gap to make bars thinner
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                    <XAxis
                      dataKey="module"
                      tick={{
                        fontSize: 14,
                        fill: "#555", // Brighter axis text
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fontSize: 14,
                        fill: "#555", // Brighter Y-axis text
                      }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        color: "#333",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                      }}
                      itemStyle={{ color: "#333" }}
                    />
                    <Bar dataKey="marks" radius={[10, 10, 0, 0]}>
                      {marks.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
