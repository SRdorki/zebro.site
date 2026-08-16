"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckoutModal } from "@/components/checkout-modal";

type Plan = {
  id: string;
  name: string;
  price: string;
  numericValue: number;
  paymentLink: string | null;
};

interface CheckoutButtonProps {
  plan: Plan;
}

export function CheckoutButton({ plan }: CheckoutButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className="w-full mt-8"
        onClick={() => setOpen(true)}
      >
        Assinar {plan.name}
      </Button>

      {open && (
        <CheckoutModal
          plan={plan}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
