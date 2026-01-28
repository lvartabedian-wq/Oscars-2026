
export type Categories = {
  [key: string]: string[];
};

export type Selections = {
  [category: string]: string;
};

export interface NominationData {
  categories: Categories;
}
