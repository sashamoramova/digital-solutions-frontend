export type Item = {
    id: number;
    value: number;
}

export type ItemsResponse = {
    statusCode: number;
    message: string;
    data: {
        items: Item[];
        total: number;
        page: number;
        totalPages: number;
    };
    error: string | null;
}

export type StateResponse = {
    statusCode: number;
    message: string;
    data: {
        order: number[];
        selected: number[];
    };
    error: string | null;
}

export type SaveOrderRequest = {
    order: number[];
}

export type SaveSelectedRequest = {
    selected: number[];
}
