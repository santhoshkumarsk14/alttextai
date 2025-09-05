import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function BulkActions({ pendingCount, onApproveAll }) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-sm text-slate-600">
        <span className="font-semibold text-orange-600">{pendingCount}</span> images pending review
      </div>
      <Button
        onClick={onApproveAll}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        Approve All ({pendingCount})
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
