export class DocumentObject {

    readonly status: string

    constructor(
    public readonly document_id : string,
    public readonly mime_type: string,
    public readonly document_name: string,
    public readonly created_date: string,
    public readonly size_in_kb: string,
    public readonly uploadedBy: string,
    public readonly foreignAssociationTable: string,
    public readonly foreignAssociationId: string,
    status: DocumentStatus
    ) {
        this.status = status == DocumentStatus.ACTIVE ? "ACTIVE" : "INACTIVE";
    }
}


enum DocumentStatus{
    ACTIVE , INACTIVE
}
