import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center mb-6">
            <img src="/logo.png" alt="Penguin Spotter Logo" className="w-20 h-20 mb-4" />
            <div className="flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
            </div>
          </div>

          <p className="text-center mb-6 text-gray-600">
            Sorry, we couldn't find the page you're looking for.
          </p>
          
          <div className="flex justify-center">
            <Link href="/">
              <Button className="bg-[#40B4E5] hover:bg-[#2D9CCC]">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
