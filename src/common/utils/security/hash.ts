import bcrypt from "bcrypt";

export const hashData = async (data: string): Promise<string> => {
  const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
  const hashedData = await bcrypt.hash(data, saltRounds);
  return hashedData;
}

export const compareHash = async (data: string, hashedData: string): Promise<boolean> => {
  const isMatch = await bcrypt.compare(data, hashedData);
  return isMatch;
}