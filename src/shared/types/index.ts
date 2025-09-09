export interface Item {
    id: number;
    value: number;
}

export interface ItemsResponse {
    items: Item[];
    total: number;
    page: number;
    pageSize: number;
}
