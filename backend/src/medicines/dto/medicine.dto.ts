export class CreateMedicineDto {
  name: string;
  genericName?: string;
  categoryId?: string;
  manufacturerId?: string;
  barcode?: string;
  price: number;
  dosage?: string;
  imageUrl?: string;
}

export class UpdateMedicineDto {
  name?: string;
  genericName?: string;
  categoryId?: string;
  manufacturerId?: string;
  barcode?: string;
  price?: number;
  dosage?: string;
  imageUrl?: string;
}
