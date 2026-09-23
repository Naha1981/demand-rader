import { z } from "zod";

export const BusinessSchema = z.object({
  id: z.string(),
  name: z.string(),
  active: z.boolean(),
  services: z.array(z.string()),
  serviceArea: z.array(z.string()),
  emergencyAvailable: z.boolean(),
  capacity: z.number().int().min(0),
  minimumJobValue: z.number().min(0),
  preferredJobTypes: z.array(z.string()),
});

export type Business = z.infer<typeof BusinessSchema>;
