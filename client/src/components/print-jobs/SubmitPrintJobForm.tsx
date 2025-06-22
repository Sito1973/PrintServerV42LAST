import React from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUp } from "lucide-react";
import { isValidUrl } from "@/lib/utils";

const formSchema = z.object({
  printerId: z.string().min(1, "Printer ID is required"),
  documentUrl: z
    .string()
    .url("Please enter a valid URL to a PDF document")
    .refine(url => url.toLowerCase().endsWith('.pdf'), {
      message: "URL must point to a PDF document",
    }),
  copies: z
    .number()
    .int()
    .min(1, "At least 1 copy is required")
    .default(1),
  duplex: z.boolean().default(false),
  orientation: z
    .enum(["portrait", "landscape"])
    .default("portrait"),
});

type FormValues = z.infer<typeof formSchema>;

interface Printer {
  id: number;
  uniqueId: string;
  name: string;
  status: string;
}

interface SubmitPrintJobFormProps {
  printers?: Printer[];
  isLoading?: boolean;
}

const SubmitPrintJobForm: React.FC<SubmitPrintJobFormProps> = ({
  printers: propsPrinters,
  isLoading: propsIsLoading,
}) => {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // If printers aren't passed as props, fetch them
  const { data: fetchedPrinters, isLoading: isFetchingPrinters } = useQuery<
    Printer[]
  >({
    queryKey: ["/api/printers"],
    enabled: !propsPrinters,
    queryFn: () => apiRequest('/api/printers'),
  });

  const printers = propsPrinters || fetchedPrinters || [];
  const isLoading = propsIsLoading || isFetchingPrinters;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      printerId: "",
      documentUrl: "",
      copies: 1,
      duplex: false,
      orientation: "portrait",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const { printerId, documentUrl, copies, duplex, orientation } = values;

      return apiRequest({
        url: "/api/print",
        method: "POST",
        body: {
          printerId,
          documentUrl,
          options: {
            copies,
            duplex,
            orientation,
          },
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/print-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

      toast({
        title: "Print job submitted",
        description: "Your document has been sent to the printer",
      });

      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to submit print job",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: FormValues) {
    mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <FileUp size={16} />
          Submit Print Job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit a Print Job</DialogTitle>
          <DialogDescription>
            Enter the details below to send a PDF document to a printer.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="printerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Printer</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a printer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {printers.map((printer) => (
                        <SelectItem
                          key={printer.uniqueId}
                          value={printer.uniqueId}
                          disabled={printer.status === "offline"}
                        >
                          {printer.name} {printer.status === "offline" && " (Offline)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a printer to send the document to.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PDF Document URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/document.pdf"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        form.trigger("documentUrl");
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the URL of the PDF document to print. The URL must be publicly accessible.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="copies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Copies</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        {...field}
                        onChange={(e) => {
                          field.onChange(parseInt(e.target.value, 10));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orientation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orientation</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select orientation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duplex"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Double-sided printing</FormLabel>
                    <FormDescription>
                      Print on both sides of the paper.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Submitting..." : "Submit Print Job"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitPrintJobForm;