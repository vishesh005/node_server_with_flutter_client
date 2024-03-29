import {Database, open} from "sqlite";
import * as sqlite3 from 'sqlite3';
import * as fs from 'fs';
import {DocumentTable, NotesTable, UserAuthTable, UserTable} from "./tables";


const dbUri = "./notes_app.db";

export abstract class AppDatabase {

    public readonly dbType: DatabaseType

    protected constructor(protected dbUri, dbType: DatabaseType) {
    }

    abstract init(): any;

    abstract openDb();

    abstract closeDb(): Promise<any>
}

export abstract class RelationalDatabase extends AppDatabase{

    protected constructor(dbUri, dbType: DatabaseType) {
        super(dbUri,dbType);
    }

    abstract executeQuery(dbQuery: string): Promise<any>

    abstract getRecord(table: string, whereColumn: string, whereValue: string): Promise<any>

    abstract getAll(table: string): Promise<any>

    abstract filterBy(table: string, operators: string[], whereClause: Map<string, string>, separators: string[], {limit: number}): Promise<any>

    abstract  getCount(table: string, operators: string[], whereClause: Map<string, string>, separators: string[], countExpression: string): Promise<number>

}

class SqliteDatabase extends RelationalDatabase {


    private static _instance: SqliteDatabase;

    public static getInstance(dbUri: string) {
        if (SqliteDatabase._instance == undefined) {
            SqliteDatabase._instance = new SqliteDatabase(dbUri);
        }
        return SqliteDatabase._instance;
    }

    private constructor(dbUri) {
        super(dbUri,DatabaseType.SQLITE);
    }

    private db: Database

    async init() {
        const isDbExists = fs.existsSync(this.dbUri);
        if (!isDbExists) {
            fs.open(this.dbUri, 'w', async (err, file) => {
                if (err) throw err;
                console.log(`Database created at ${new Date()}`);
                await this.setupTables();
            })
        }
        else{
            await this.setupTables();
        }
    }

   private async setupTables() {
        let db : Database
        try{
           db = await open({filename: this.dbUri, driver: sqlite3.Database});
           await this._migrateTables(db);
           await this._createTables(db);
        }catch (e) {
            console.log(e);
        }finally {
            if(db != undefined){
               await db.close();
            }
        }
    }

    private async _createTables(db: Database) {
       await db.exec(UserTable.createQuery);
       await db.exec(UserAuthTable.createQuery);
       await db.exec(NotesTable.createQuery);
       await db.exec(DocumentTable.createQuery);
    }

    private async _migrateTables(db: Database) {

    }




    async openDb() {
        if (this.db == undefined) {
            this.db = await open(
                {
                    filename: this.dbUri,
                    driver: sqlite3.Database
                }
            );
        }
    }

    async closeDb() {
        await this.db.close();
        this.db = undefined;
    }

    async executeQuery(dbQuery: string) : Promise<any>{
        return await this.db.run(dbQuery);
    }

    async filterBy(table: string, operators: string[], whereClause: Map<string, string>, separators: string[], {limit}) : Promise<any> {
        let whereStatement: string = ""
        const clauses = Array.from(whereClause.keys());
        for (let i = 0; i < clauses.length; i++) {
            whereStatement += `${clauses[i]} ${operators[i]} ${whereClause.get(clauses[i])} ${(i <= separators.length - 1) ? separators[i] : ''} `
        }

        return  this.db.all(`SELECT * FROM ${table} WHERE ${whereStatement} ${typeof limit == "number" && limit > 0 ? `LIMIT ${limit}`: ''}`);
    }

    async getAll(table: string) : Promise<any> {
        return this.db.all(`SELECT * FROM ${table}`)
    }

    getRecord(table: string, whereColumn: string, whereValue: string): Promise<any> {
        return this.db.get(`SELECT * FROM ${table} WHERE ${whereColumn}="${whereValue}"`);
    }

    getCount(table: string, operators: string[], whereClause: Map<string, string>, separators: string[], countExpression: string): Promise<number> {
        let whereStatement: string = "";
        const clauses = Array.from(whereClause.keys());
        for (let i = 0; i < clauses.length; i++) {
            whereStatement += `${clauses[i]} ${operators[i]} ${whereClause.get(clauses[i])} ${(i <= separators.length - 1) ? separators[i] : ''}`
        }

        return  this.db.all(`COUNT(${countExpression}) FROM ${table} WHERE ${whereStatement}`);
    }

}

export abstract class NoSqlDatabase extends AppDatabase {

    protected constructor(protected dbUri, dbType: DatabaseType) {
        super(dbUri,dbType);
    }


}

export  class MongoDatabase extends  NoSqlDatabase {

    private static _instance: MongoDatabase;

    public static getInstance(dbUri: string) {
        if (MongoDatabase._instance == undefined) {
            MongoDatabase._instance = new MongoDatabase(dbUri);
        }
        return MongoDatabase._instance;
    }

    private constructor(dbUri) {
        super(dbUri,DatabaseType.MONGO_DB);
    }

    init(): any {
    }

    closeDb(): Promise<any> {
        return Promise.resolve(undefined);
    }

    openDb() {
    }



}

export class DatabaseFactory {

    static getDatabaseInstance(): AppDatabase {
        let dbType =  process?.env?.DB_TYPE ?? "SQLITE";
        switch (dbType) {
            case DatabaseType.SQLITE:
                return SqliteDatabase.getInstance(dbUri);
            case DatabaseType.MONGO_DB:
                return MongoDatabase.getInstance(dbUri);
            default:
                return SqliteDatabase.getInstance(dbUri);
        }
    }

}

export enum DatabaseType {
    SQLITE = "SQLITE",
    POSTGRES_SQL = "POSTGRES_SQL",
    MONGO_DB = "MONGO_DB"
}

