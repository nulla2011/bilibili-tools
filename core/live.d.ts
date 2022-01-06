declare namespace live {
  function getRoomID(input: string): number;
}
declare class Room {
  id: number;
  live_status?: number;
  title: string;
  constructor(ID: number);
  getInfo();
}
export { getRoomID, Room };