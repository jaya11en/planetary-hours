import { type GetServerSideProps, type NextPage } from "next";

// The app lives at /planetaryHours; send the root there.
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/planetaryHours",
      permanent: false,
    },
  };
};

const Home: NextPage = () => null;

export default Home;
