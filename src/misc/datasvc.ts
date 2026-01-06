import { DateTime } from "luxon";

const wmsUrl = 'https://uas-betrieb.de/geoservices/dipul/wms';
const baseUrl = 'https://dipul-service.dfs.de/api/geoapi/dipul';
const tokenUrl = 'https://uas-betrieb.dfs.de/api/token/v1/anonymous/bmdv/token';

const dipulLayerList = [
    "dipul:flugplaetze",
    "dipul:flughaefen",
    "dipul:kontrollzonen",
    "dipul:flugbeschraenkungsgebiete",
    "dipul:bundesautobahnen",
    "dipul:bundesstrassen",
    "dipul:bahnanlagen",
    "dipul:binnenwasserstrassen",
    "dipul:seewasserstrassen",
    "dipul:schifffahrtsanlagen",
    "dipul:wohngrundstuecke",
    "dipul:freibaeder",
    "dipul:industrieanlagen",
    "dipul:kraftwerke",
    "dipul:umspannwerke",
    "dipul:stromleitungen",
    "dipul:windkraftanlagen",
    "dipul:justizvollzugsanstalten",
    "dipul:militaerische_anlagen",
    "dipul:labore",
    "dipul:behoerden",
    "dipul:diplomatische_vertretungen",
    "dipul:internationale_organisationen",
    "dipul:polizei",
    "dipul:sicherheitsbehoerden",
    "dipul:krankenhaeuser",
    "dipul:nationalparks",
    "dipul:naturschutzgebiete",
    "dipul:vogelschutzgebiete",
    "dipul:ffh-gebiete",
    "dipul:modellflugplaetze",
    "dipul:haengegleiter",
    "dipul:temporaere_betriebseinschraenkungen"
];

interface ITokenData {
    expiration: string;
    token: string;
}

interface IAreaInfo {
    typeCode: string;
    genNames: string[];
    typeCodeDetail?: string;
    names?: string[];
}

interface IAffectedAreasResponse {
    status: string;
    affectedAreas: IAreaInfo[];
}

let tokenData: ITokenData | null = null;

const getToken: () => Promise<string | undefined> = async () => {
    if (tokenData) {
        const expiration = DateTime.fromISO(tokenData.expiration);
        if (expiration > DateTime.now()) {
            return tokenData.token;
        }
    }
    return fetch(tokenUrl)
        .then(d => d.json())
        .then(d => tokenData = d)
        .then(_ => tokenData?.token)
        .catch(_ => undefined);
}

const getAreaInfo = async (typeCode: string, lat: number, lon: number): Promise<IAreaInfo[] | undefined> => {
    const token = await getToken();
    const url = `${baseUrl}/v4/affectedAreas?typeCode=${typeCode}`;

    return fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Accept-Language": ""
        },
        body: JSON.stringify({
            "geometry": {
                "coordinates": [
                    lon,
                    lat
                ],
                "type": "Point"
            },
            "properties": {
                "altitude": {
                    "altitudeReference": "AGL",
                    "unit": "m",
                    "value": 0
                }
            },
            "type": "Feature"
        })
    })
        .then(d => d.json())
        .then((d: IAffectedAreasResponse) => {
            if (d.status != "OK") return [];
            return d.affectedAreas;
        })
}

const getAffectedAreas = async (lat: number, lon: number) => {
    const token = await getToken();
    return fetch(`${baseUrl}/v2/affectedAreas/typeCode/count`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            "geometry": {
                "coordinates": [
                    lon,
                    lat
                ],
                "type": "Point"
            },
            "properties": {
                "altitude": {
                    "altitudeReference": "AGL",
                    "unit": "m",
                    "value": 0
                }
            },
            "type": "Feature"
        })
    })
        .then(d => d.json())
        .then(d => {
            return Object.keys(d).reduce((p, c) => { if (d[c]) { p.push(c); } return p; }, [] as string[])
        })
        .then(async (typeCodes) => {
            let retval: IAreaInfo[] = [];
            const queries = typeCodes.map(typeCode => getAreaInfo(typeCode, lat, lon).then(d => {
                if (!d) return;
                d.forEach(i => retval.push(i));
            }));
            await Promise.all(queries);
            return retval;
        })
        .catch(_ => [])
}

export { getAffectedAreas, dipulLayerList, wmsUrl }
export type { IAreaInfo }
