import { useState } from "react";
import OpenLocationCode from "open-location-code-typescript";
import {
  Button,
  Container,
  Heading,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";

const queryGsi = async (address: string) => {
  const res = await fetch(
    `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(
      address
    )}`
  );
  const resJson = await res.json();
  const [lon, lat]: [number, number] = resJson[0].geometry.coordinates;
  return { lon, lat };
};

const splitLocalPlusCode = (localPlusCode: string) => {
  const match = localPlusCode.match(/([A-Za-z0-9]+\+[A-Za-z0-9+]+)\s+(.*)/);
  return { localPlusCode: match?.[1], address: match?.[2] };
};

const yjcarnaviUrlFromPlusCode = async (plusCode: string) => {
  const { localPlusCode, address } = splitLocalPlusCode(plusCode);
  if (!localPlusCode || !address) {
    return "";
  }
  if (!OpenLocationCode.isValid(localPlusCode)) {
    return "";
  }
  const base = await queryGsi(address);

  const { latitudeCenter, longitudeCenter } = OpenLocationCode.decode(
    OpenLocationCode.recoverNearest(localPlusCode, base.lat, base.lon)
  );
  // https://map.yahoo.co.jp/blog/archives/20150202_carnavischeme.html
  return `yjcarnavi://navi/select?lat=${latitudeCenter}&lon=${longitudeCenter}`;
};

function App() {
  const [plusCodeInput, setPlusCodeInput] = useState<string>("");
  const [yjcarnaviUrl, setYjcarnaviUrl] = useState<string>("");

  const onSetPlusCodeInput = async (plusCode: string) => {
    setPlusCodeInput(plusCode);
    setYjcarnaviUrl(await yjcarnaviUrlFromPlusCode(plusCode));
  };

  return (
    <>
      <VStack>
        <Container>
          <Heading>Plus Codes to Yahoo! カーナビ</Heading>
        </Container>
        <Container>
          <Input
            type="text"
            value={plusCodeInput}
            onChange={(e) => onSetPlusCodeInput(e.target.value)}
            placeholder="MG6P+73 中之条町、群馬県"
          />
        </Container>
        <Container>
          <Button
            href={yjcarnaviUrl}
            as="a"
            isDisabled={!yjcarnaviUrl}
            colorScheme="red"
          >
            Yahoo! カーナビ で開く
          </Button>
        </Container>
        {yjcarnaviUrl && (
          <Container>
            <Text fontSize="xs" color="gray">{yjcarnaviUrl} を開きます</Text>
          </Container>
        )}
      </VStack>
    </>
  );
}

export default App;
