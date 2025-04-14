// types/pdf-parse.d.ts
declare module "pdf-parse" {
  interface PDFParseData {
    text: string;
    version: string;
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
  }

  function pdf(buffer: Buffer | Uint8Array): Promise<PDFParseData>;

  export = pdf;
}
