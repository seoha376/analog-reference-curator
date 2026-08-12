import { CuratorBoard } from "./CuratorBoard";
import candidates from "../work/analog-reference-curator/data/web-candidates.json";
import folders from "../work/analog-reference-curator/data/folders.json";

export default function Home() {
  return <CuratorBoard initialCandidates={candidates} folders={folders} />;
}
