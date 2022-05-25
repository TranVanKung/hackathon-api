import TransferEvent from "@/model/transferEvent";

const findOneTransferEvent = async (condition: any) => {
  try {
    const foundedTransferEvent = await TransferEvent.findOne(condition);
    return foundedTransferEvent;
  } catch (err: any) {
    console.log(err);
  }
};

const findManyTransferEvent = async (condition: any) => {
  try {
    const foundedTransferEvent = await TransferEvent.find(condition);
    return foundedTransferEvent;
  } catch (err: any) {
    console.log(err);
  }
};

const getAllTransferEvent = async () => {
  try {
    const listData = await TransferEvent.find({});
    return listData;
  } catch (err: any) {
    console.log(err);
  }
};

const createTransferEvent = async (data: any | any[]) => {
  try {
    const createdData = await TransferEvent.insertMany(data, {
      ordered: false,
    });
    return createdData;
  } catch (err: any) {
    // console.log(err);
  }
};

const updateTransferEvent = async (_id: string, data: any) => {
  try {
    const updatedData = await TransferEvent.findOneAndUpdate({ _id }, data, {
      new: true,
    });

    return updatedData;
  } catch (err: any) {
    console.log(err);
  }
};

const deleteTransferEvent = async (listTransferEventId: string[]) => {
  try {
    const deletedData = await TransferEvent.deleteMany({
      _id: { $in: listTransferEventId },
    });

    return deletedData;
  } catch (err: any) {
    console.log(err);
  }
};

const deleteAllTransferEvent = async () => {
  try {
    const deletedData = await TransferEvent.deleteMany({});

    return deletedData;
  } catch (err: any) {
    console.log(err);
  }
};

const getTotalTransferEvent = async () => {
  try {
    const total = await TransferEvent.countDocuments();

    return total;
  } catch (err: any) {
    console.log(err);
  }
};

export {
  createTransferEvent,
  findOneTransferEvent,
  updateTransferEvent,
  deleteTransferEvent,
  deleteAllTransferEvent,
  getTotalTransferEvent,
  getAllTransferEvent,
  findManyTransferEvent,
};
